ALTER PROC [dbo].[spPatients_Update]
  @PatientId INT,
  @ExamDate DATE,
  @Name NVARCHAR(150),
  @Address NVARCHAR(200)=NULL,
  @Phone NVARCHAR(30)=NULL,
  @Optometrist NVARCHAR(50)=NULL,
  @IdClinica INT = NULL,

  @IsFirstExam BIT=NULL,
  @UsesRx BIT=NULL,
  @HasDiabetes BIT=NULL,
  @HasBlindness BIT=NULL,
  @HasHypertension BIT=NULL,

  @HasCefalea BIT=NULL,
  @HasArdorOcular BIT=NULL,
  @HasDolorOcular BIT=NULL,
  @HasPrurito BIT=NULL,
  @HasFotofobia BIT=NULL,
  @HasBlindness2 BIT=NULL,
  @HasVisionBorrosa BIT=NULL,
  @HasSecreciones BIT=NULL,

  @OD_Sphere_Lensometry NVARCHAR(20)=NULL,
  @OD_Cyl_Lensometry NVARCHAR(20)=NULL,
  @OD_Axis_Lensometry NVARCHAR(20)=NULL,
  @OD_Add_Lensometry NVARCHAR(20)=NULL,
  @OI_Sphere_Lensometry NVARCHAR(20)=NULL,
  @OI_Cyl_Lensometry NVARCHAR(20)=NULL,
  @OI_Axis_Lensometry NVARCHAR(20)=NULL,
  @OI_Add_Lensometry NVARCHAR(20)=NULL,

  @AV_OD_20 NVARCHAR(20)=NULL,
  @PH_OD_20 NVARCHAR(20)=NULL,
  @CC_OD_20 NVARCHAR(20)=NULL,
  @AV_OI_20 NVARCHAR(20)=NULL,
  @PH_OI_20 NVARCHAR(20)=NULL,
  @CC_OI_20 NVARCHAR(20)=NULL,

  @Auto_OD_Sphere NVARCHAR(20)=NULL,
  @Auto_OD_Cyl NVARCHAR(20)=NULL,
  @Auto_OD_Axis NVARCHAR(20)=NULL,
  @Auto_OI_Sphere NVARCHAR(20)=NULL,
  @Auto_OI_Cyl NVARCHAR(20)=NULL,
  @Auto_OI_Axis NVARCHAR(20)=NULL,

  @Rx_OD_Sphere NVARCHAR(20)=NULL,
  @Rx_OD_Cyl NVARCHAR(20)=NULL,
  @Rx_OD_Axis NVARCHAR(20)=NULL,
  @Rx_OD_Add NVARCHAR(20)=NULL,
  @Rx_OD_Alt NVARCHAR(20)=NULL,

  @Rx_OI_Sphere NVARCHAR(20)=NULL,
  @Rx_OI_Cyl NVARCHAR(20)=NULL,
  @Rx_OI_Axis NVARCHAR(20)=NULL,
  @Rx_OI_Add NVARCHAR(20)=NULL,
  @Rx_OI_Alt NVARCHAR(20)=NULL,

  @Frame NVARCHAR(80)=NULL,
  @Dip NVARCHAR(30)=NULL,
  @Material NVARCHAR(80)=NULL,
  @Lens NVARCHAR(120)=NULL,
  @Treatment NVARCHAR(120)=NULL,
  @Products NVARCHAR(MAX)=NULL,

  @Total DECIMAL(10,2)=NULL,
  @Deposit DECIMAL(10,2)=NULL,
  @Balance DECIMAL(10,2)=NULL,
  @PaymentMethod NVARCHAR(30)=NULL,
  @Comments NVARCHAR(500)=NULL,

  @UpdatedByUserId INT=NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @ProductsJson NVARCHAR(MAX) = NULLIF(LTRIM(RTRIM(@Products)), '');
  DECLARE @CurrentProductsJson NVARCHAR(MAX) = NULL;
  DECLARE @CurrentIdClinica INT = NULL;
  DECLARE @CurrentOrderNo INT = NULL;
  DECLARE @FinalOrderNo INT = NULL;

  DECLARE @ParsedProducts TABLE
  (
      ProductId INT NULL,
      Cantidad INT NULL,
      IdClinica INT NULL
  );

  DECLARE @NewProducts TABLE
  (
      ProductId INT NOT NULL,
      Cantidad INT NOT NULL,
      IdClinica INT NOT NULL,
      PRIMARY KEY (ProductId, IdClinica)
  );

  DECLARE @ParsedCurrentProducts TABLE
  (
      ProductId INT NULL,
      Cantidad INT NULL,
      IdClinica INT NULL
  );

  DECLARE @CurrentProducts TABLE
  (
      ProductId INT NOT NULL,
      Cantidad INT NOT NULL,
      IdClinica INT NOT NULL,
      PRIMARY KEY (ProductId, IdClinica)
  );

  DECLARE @InventoryDelta TABLE
  (
      ProductId INT NOT NULL,
      IdClinica INT NOT NULL,
      DeltaQty INT NOT NULL,
      PRIMARY KEY (ProductId, IdClinica)
  );

  IF @IdClinica IS NULL OR @IdClinica <= 0
  BEGIN
      THROW 50029, 'IdClinica es requerida para mantener numero de orden por clinica.', 1;
  END

  IF NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @IdClinica)
  BEGIN
      THROW 50020, 'La clinica enviada no existe.', 1;
  END

  IF @Balance IS NULL
  BEGIN
    DECLARE @t DECIMAL(10,2) = ISNULL(@Total,0);
    DECLARE @d DECIMAL(10,2) = ISNULL(@Deposit,0);
    SET @Balance = CASE WHEN @t-@d < 0 THEN 0 ELSE @t-@d END;
  END

  BEGIN TRY
    BEGIN TRAN;

    SELECT TOP(1)
      @CurrentOrderNo = p.OrderNo,
      @CurrentIdClinica = p.IdClinica,
      @CurrentProductsJson = NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), p.Products))), '')
    FROM dbo.Patients p WITH (UPDLOCK, HOLDLOCK)
    WHERE p.PatientId = @PatientId;

    IF @CurrentOrderNo IS NULL
    BEGIN
      THROW 50028, 'El paciente indicado no existe.', 1;
    END

    IF @CurrentProductsJson IS NOT NULL
       AND ISJSON(@CurrentProductsJson) = 1
    BEGIN
      INSERT INTO @ParsedCurrentProducts (ProductId, Cantidad, IdClinica)
      SELECT
        ProductId,
        Cantidad,
        COALESCE(ItemIdClinica, @CurrentIdClinica)
      FROM OPENJSON(@CurrentProductsJson)
      WITH
      (
        ProductId INT '$.productId',
        Cantidad INT '$.cantidad',
        ItemIdClinica INT '$.idClinica'
      );

      INSERT INTO @CurrentProducts (ProductId, Cantidad, IdClinica)
      SELECT
        ProductId,
        SUM(Cantidad),
        IdClinica
      FROM @ParsedCurrentProducts
      WHERE ProductId IS NOT NULL
        AND Cantidad IS NOT NULL
        AND Cantidad > 0
        AND IdClinica IS NOT NULL
      GROUP BY ProductId, IdClinica;
    END

    IF @ProductsJson IS NOT NULL
    BEGIN
      IF ISJSON(@ProductsJson) <> 1
      BEGIN
        THROW 50021, 'Products debe ser un JSON valido.', 1;
      END

      INSERT INTO @ParsedProducts (ProductId, Cantidad, IdClinica)
      SELECT
        ProductId,
        Cantidad,
        COALESCE(ItemIdClinica, @IdClinica)
      FROM OPENJSON(@ProductsJson)
      WITH
      (
        ProductId INT '$.productId',
        Cantidad INT '$.cantidad',
        ItemIdClinica INT '$.idClinica'
      );

      IF EXISTS (
        SELECT 1
        FROM @ParsedProducts
        WHERE ProductId IS NULL
           OR Cantidad IS NULL
           OR Cantidad <= 0
      )
      BEGIN
        THROW 50022, 'Cada producto debe incluir productId y cantidad mayor a 0.', 1;
      END

      IF EXISTS (
        SELECT 1
        FROM @ParsedProducts
        WHERE IdClinica IS NULL
      )
      BEGIN
        THROW 50023, 'Cada producto debe incluir idClinica o la orden debe tener IdClinica.', 1;
      END

      IF EXISTS (
        SELECT 1
        FROM @ParsedProducts
        WHERE IdClinica <> @IdClinica
      )
      BEGIN
        THROW 50024, 'Todos los productos deben pertenecer a la misma clinica de la orden.', 1;
      END

      INSERT INTO @NewProducts (ProductId, Cantidad, IdClinica)
      SELECT
        ProductId,
        SUM(Cantidad),
        IdClinica
      FROM @ParsedProducts
      GROUP BY ProductId, IdClinica;
    END

    SET @FinalOrderNo = @CurrentOrderNo;

    IF ISNULL(@CurrentIdClinica, 0) <> @IdClinica
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM dbo.Clinics WITH (UPDLOCK, HOLDLOCK)
        WHERE ClinicId = @IdClinica
      )
      BEGIN
        THROW 50020, 'La clinica enviada no existe.', 1;
      END

      UPDATE coc
      SET
        @FinalOrderNo = coc.NextOrderNo,
        coc.NextOrderNo = coc.NextOrderNo + 1,
        coc.UpdatedAt = SYSDATETIME()
      FROM dbo.ClinicOrderCounters coc WITH (UPDLOCK, HOLDLOCK)
      WHERE coc.ClinicId = @IdClinica;

      IF @FinalOrderNo IS NULL
      BEGIN
        SELECT @FinalOrderNo = ISNULL(MAX(p.OrderNo), 0) + 1
        FROM dbo.Patients p WITH (UPDLOCK, HOLDLOCK)
        WHERE p.IdClinica = @IdClinica;

        INSERT INTO dbo.ClinicOrderCounters (ClinicId, NextOrderNo, UpdatedAt)
        VALUES (@IdClinica, @FinalOrderNo + 1, SYSDATETIME());
      END
    END

    INSERT INTO @InventoryDelta (ProductId, IdClinica, DeltaQty)
    SELECT
      COALESCE(n.ProductId, c.ProductId),
      COALESCE(n.IdClinica, c.IdClinica),
      ISNULL(n.Cantidad, 0) - ISNULL(c.Cantidad, 0)
    FROM @CurrentProducts c
    FULL OUTER JOIN @NewProducts n
      ON n.ProductId = c.ProductId
     AND n.IdClinica = c.IdClinica
    WHERE ISNULL(n.Cantidad, 0) <> ISNULL(c.Cantidad, 0);

    IF EXISTS (
      SELECT 1
      FROM @InventoryDelta d
      LEFT JOIN dbo.InventoryProducts i WITH (UPDLOCK, HOLDLOCK)
        ON i.ProductId = d.ProductId
       AND i.IdClinica = d.IdClinica
      WHERE i.ProductId IS NULL
    )
    BEGIN
      THROW 50025, 'Uno o mas productos no existen para la clinica indicada.', 1;
    END

    IF EXISTS (
      SELECT 1
      FROM @InventoryDelta d
      INNER JOIN dbo.InventoryProducts i WITH (UPDLOCK, HOLDLOCK)
        ON i.ProductId = d.ProductId
       AND i.IdClinica = d.IdClinica
      WHERE d.DeltaQty > 0
        AND ISNULL(i.Existencia, 0) < d.DeltaQty
    )
    BEGIN
      THROW 50026, 'Existencia insuficiente para uno o mas productos.', 1;
    END

    UPDATE dbo.Patients
    SET
      OrderNo = @FinalOrderNo,
      ExamDate = @ExamDate,
      Name = @Name,
      Address = @Address,
      Phone = @Phone,
      Optometrist = @Optometrist,
      IdClinica = @IdClinica,
      IsFirstExam = @IsFirstExam,
      UsesRx = @UsesRx,
      HasDiabetes = @HasDiabetes,
      HasBlindness = @HasBlindness,
      HasHypertension = @HasHypertension,
      HasCefalea = @HasCefalea,
      HasArdorOcular = @HasArdorOcular,
      HasDolorOcular = @HasDolorOcular,
      HasPrurito = @HasPrurito,
      HasFotofobia = @HasFotofobia,
      HasBlindness2 = @HasBlindness2,
      HasVisionBorrosa = @HasVisionBorrosa,
      HasSecreciones = @HasSecreciones,
      OD_Sphere_Lensometry = @OD_Sphere_Lensometry,
      OD_Cyl_Lensometry = @OD_Cyl_Lensometry,
      OD_Axis_Lensometry = @OD_Axis_Lensometry,
      OD_Add_Lensometry = @OD_Add_Lensometry,
      OI_Sphere_Lensometry = @OI_Sphere_Lensometry,
      OI_Cyl_Lensometry = @OI_Cyl_Lensometry,
      OI_Axis_Lensometry = @OI_Axis_Lensometry,
      OI_Add_Lensometry = @OI_Add_Lensometry,
      AV_OD_20 = @AV_OD_20,
      PH_OD_20 = @PH_OD_20,
      CC_OD_20 = @CC_OD_20,
      AV_OI_20 = @AV_OI_20,
      PH_OI_20 = @PH_OI_20,
      CC_OI_20 = @CC_OI_20,
      Auto_OD_Sphere = @Auto_OD_Sphere,
      Auto_OD_Cyl = @Auto_OD_Cyl,
      Auto_OD_Axis = @Auto_OD_Axis,
      Auto_OI_Sphere = @Auto_OI_Sphere,
      Auto_OI_Cyl = @Auto_OI_Cyl,
      Auto_OI_Axis = @Auto_OI_Axis,
      Rx_OD_Sphere = @Rx_OD_Sphere,
      Rx_OD_Cyl = @Rx_OD_Cyl,
      Rx_OD_Axis = @Rx_OD_Axis,
      Rx_OD_Add = @Rx_OD_Add,
      Rx_OD_Alt = @Rx_OD_Alt,
      Rx_OI_Sphere = @Rx_OI_Sphere,
      Rx_OI_Cyl = @Rx_OI_Cyl,
      Rx_OI_Axis = @Rx_OI_Axis,
      Rx_OI_Add = @Rx_OI_Add,
      Rx_OI_Alt = @Rx_OI_Alt,
      Frame = @Frame,
      Dip = @Dip,
      Material = @Material,
      Lens = @Lens,
      Treatment = @Treatment,
      Products = @ProductsJson,
      Total = @Total,
      Deposit = @Deposit,
      Balance = @Balance,
      PaymentMethod = @PaymentMethod,
      Comments = @Comments,
      UpdatedAt = SYSDATETIME(),
      UpdatedByUserId = @UpdatedByUserId
    WHERE PatientId = @PatientId;

    IF @@ROWCOUNT <> 1
    BEGIN
      THROW 50028, 'El paciente indicado no existe.', 1;
    END

    IF EXISTS (SELECT 1 FROM @InventoryDelta)
    BEGIN
      UPDATE i
      SET i.Existencia = i.Existencia - d.DeltaQty,
          i.UpdatedAt = SYSDATETIME()
      FROM dbo.InventoryProducts i
      INNER JOIN @InventoryDelta d
        ON d.ProductId = i.ProductId
       AND d.IdClinica = i.IdClinica;

      IF @@ROWCOUNT <> (SELECT COUNT(1) FROM @InventoryDelta)
      BEGIN
        THROW 50027, 'No se pudo actualizar el inventario de todos los productos.', 1;
      END
    END

    COMMIT TRAN;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRAN;
    THROW;
  END CATCH

  SELECT TOP(1)
      PatientId,
      OrderNo,
      Name,
      IdClinica,
      Products
  FROM dbo.Patients
  WHERE PatientId = @PatientId;
END
