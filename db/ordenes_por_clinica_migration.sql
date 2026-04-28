/*
  Migracion: correlativo de orden por clinica

  Objetivo:
  - Permitir OrderNo repetido entre clinicas distintas.
  - Mantener OrderNo unico dentro de cada clinica.
  - Renumerar el historico para que cada clinica inicie en 1.
  - Crear una tabla de correlativos por clinica.
  - Actualizar los procedimientos almacenados que crean, editan y consultan ordenes.

  Nota:
  - Se crea un respaldo de los numeros de orden actuales en dbo.PatientOrderNoMigrationBackup
    la primera vez que se ejecute este script.
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF COL_LENGTH('dbo.Patients', 'Profession') IS NULL
BEGIN
  ALTER TABLE dbo.Patients
  ADD Profession NVARCHAR(120) NULL;
END
GO

IF OBJECT_ID('dbo.PatientOrderNoMigrationBackup', 'U') IS NULL
BEGIN
  SELECT
    p.PatientId,
    p.IdClinica,
    p.OrderNo AS OldOrderNo,
    p.CreatedAt,
    SYSDATETIME() AS BackedUpAt
  INTO dbo.PatientOrderNoMigrationBackup
  FROM dbo.Patients p;
END
GO

IF OBJECT_ID('dbo.ClinicOrderCounters', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ClinicOrderCounters
  (
    ClinicId INT NOT NULL,
    NextOrderNo INT NOT NULL,
    UpdatedAt DATETIME2(0) NOT NULL
      CONSTRAINT DF_ClinicOrderCounters_UpdatedAt DEFAULT (SYSDATETIME()),
    CONSTRAINT PK_ClinicOrderCounters PRIMARY KEY CLUSTERED (ClinicId),
    CONSTRAINT FK_ClinicOrderCounters_Clinics
      FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics (ClinicId),
    CONSTRAINT CK_ClinicOrderCounters_NextOrderNo CHECK (NextOrderNo > 0)
  );
END
GO

SET XACT_ABORT ON;
GO

BEGIN TRAN;

IF EXISTS (
  SELECT 1
  FROM dbo.Patients
  WHERE IdClinica IS NULL
)
BEGIN
  ROLLBACK TRAN;
  THROW 53001, 'Hay ordenes con IdClinica NULL. Asigna una clinica antes de migrar a correlativos por clinica.', 1;
END

IF EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE object_id = OBJECT_ID('dbo.Patients')
    AND name = 'UX_Patients_IdClinica_OrderNo'
)
BEGIN
  DROP INDEX UX_Patients_IdClinica_OrderNo ON dbo.Patients;
END

DECLARE @OldOrderUq SYSNAME = NULL;
DECLARE @OldOrderIndex SYSNAME = NULL;
DECLARE @SqlDrop NVARCHAR(MAX) = NULL;

SELECT TOP (1)
  @OldOrderUq = kc.name
FROM sys.key_constraints kc
INNER JOIN sys.index_columns ic
  ON ic.object_id = kc.parent_object_id
 AND ic.index_id = kc.unique_index_id
INNER JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE kc.parent_object_id = OBJECT_ID('dbo.Patients')
  AND kc.type = 'UQ'
GROUP BY kc.name
HAVING COUNT(*) = 1
   AND MAX(CASE WHEN c.name = 'OrderNo' THEN 1 ELSE 0 END) = 1;

IF @OldOrderUq IS NOT NULL
BEGIN
  SET @SqlDrop = N'ALTER TABLE dbo.Patients DROP CONSTRAINT ' + QUOTENAME(@OldOrderUq) + N';';
  EXEC sys.sp_executesql @SqlDrop;
END

SELECT TOP (1)
  @OldOrderIndex = i.name
FROM sys.indexes i
INNER JOIN sys.index_columns ic
  ON ic.object_id = i.object_id
 AND ic.index_id = i.index_id
INNER JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE i.object_id = OBJECT_ID('dbo.Patients')
  AND i.is_unique = 1
  AND i.is_primary_key = 0
GROUP BY i.name
HAVING COUNT(*) = 1
   AND MAX(CASE WHEN c.name = 'OrderNo' THEN 1 ELSE 0 END) = 1;

IF @OldOrderIndex IS NOT NULL
BEGIN
  SET @SqlDrop = N'DROP INDEX ' + QUOTENAME(@OldOrderIndex) + N' ON dbo.Patients;';
  EXEC sys.sp_executesql @SqlDrop;
END

;WITH Ordered AS
(
  SELECT
    p.PatientId,
    ROW_NUMBER() OVER (
      PARTITION BY p.IdClinica
      ORDER BY p.OrderNo ASC, p.PatientId ASC
    ) AS NewOrderNo
  FROM dbo.Patients p
)
UPDATE p
SET p.OrderNo = o.NewOrderNo
FROM dbo.Patients p
INNER JOIN Ordered o
  ON o.PatientId = p.PatientId
WHERE p.OrderNo <> o.NewOrderNo;

MERGE dbo.ClinicOrderCounters AS target
USING
(
  SELECT
    c.ClinicId,
    ISNULL(MAX(p.OrderNo), 0) + 1 AS NextOrderNo
  FROM dbo.Clinics c
  LEFT JOIN dbo.Patients p
    ON p.IdClinica = c.ClinicId
  GROUP BY c.ClinicId
) AS source
  ON target.ClinicId = source.ClinicId
WHEN MATCHED THEN
  UPDATE
  SET
    target.NextOrderNo = source.NextOrderNo,
    target.UpdatedAt = SYSDATETIME()
WHEN NOT MATCHED THEN
  INSERT (ClinicId, NextOrderNo, UpdatedAt)
  VALUES (source.ClinicId, source.NextOrderNo, SYSDATETIME());

CREATE UNIQUE NONCLUSTERED INDEX UX_Patients_IdClinica_OrderNo
ON dbo.Patients (IdClinica ASC, OrderNo ASC)
WHERE IdClinica IS NOT NULL;

COMMIT TRAN;
GO

CREATE OR ALTER PROC [dbo].[spClinics_Create]
    @Codigo NVARCHAR(50),
    @Nombre NVARCHAR(150),
    @Estado BIT = 1,
    @Logo TEXT,
    @Telefono BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM dbo.Clinics WHERE Codigo = @Codigo)
        THROW 50100, 'Ya existe una clínica con ese Codigo.', 1;

    BEGIN TRAN;

    INSERT INTO dbo.Clinics (Codigo, Nombre, Estado, Logo, telefono)
    VALUES (@Codigo, @Nombre, @Estado, @Logo, @Telefono);

    DECLARE @ClinicId INT = SCOPE_IDENTITY();

    IF NOT EXISTS (SELECT 1 FROM dbo.ClinicOrderCounters WHERE ClinicId = @ClinicId)
    BEGIN
      INSERT INTO dbo.ClinicOrderCounters (ClinicId, NextOrderNo, UpdatedAt)
      VALUES (@ClinicId, 1, SYSDATETIME());
    END

    COMMIT TRAN;

    SELECT TOP(1)
        ClinicId, Codigo, Nombre, Estado, telefono, CreatedAt, UpdatedAt
    FROM dbo.Clinics
    WHERE ClinicId = @ClinicId;
END
GO

CREATE OR ALTER PROC [dbo].[spPatients_Create]
  @ExamDate DATE,
  @Name NVARCHAR(150),
  @Address NVARCHAR(200)=NULL,
  @Profession NVARCHAR(120)=NULL,
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

  @CreatedByUserId INT=NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  DECLARE @ProductsJson NVARCHAR(MAX) = NULLIF(LTRIM(RTRIM(@Products)), '');
  DECLARE @ParsedProducts TABLE
  (
      ProductId INT NULL,
      Cantidad INT NULL,
      IdClinica INT NULL
  );
  DECLARE @ProductsToDiscount TABLE
  (
      ProductId INT NOT NULL,
      Cantidad INT NOT NULL,
      IdClinica INT NOT NULL,
      PRIMARY KEY (ProductId, IdClinica)
  );

  DECLARE @OrderNo INT = NULL;
  DECLARE @PatientId INT = NULL;

  IF @IdClinica IS NULL OR @IdClinica <= 0
  BEGIN
      THROW 50029, 'IdClinica es requerida para generar numero de orden por clinica.', 1;
  END

  IF NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @IdClinica)
  BEGIN
      THROW 50020, 'La clinica enviada no existe.', 1;
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

    INSERT INTO @ProductsToDiscount (ProductId, Cantidad, IdClinica)
    SELECT
      ProductId,
      SUM(Cantidad),
      IdClinica
    FROM @ParsedProducts
    GROUP BY ProductId, IdClinica;
  END

  IF @Balance IS NULL
  BEGIN
    DECLARE @t DECIMAL(10,2) = ISNULL(@Total,0);
    DECLARE @d DECIMAL(10,2) = ISNULL(@Deposit,0);
    SET @Balance = CASE WHEN @t - @d < 0 THEN 0 ELSE @t - @d END;
  END

  BEGIN TRY
    BEGIN TRAN;

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
      @OrderNo = coc.NextOrderNo,
      coc.NextOrderNo = coc.NextOrderNo + 1,
      coc.UpdatedAt = SYSDATETIME()
    FROM dbo.ClinicOrderCounters coc WITH (UPDLOCK, HOLDLOCK)
    WHERE coc.ClinicId = @IdClinica;

    IF @OrderNo IS NULL
    BEGIN
      SELECT @OrderNo = ISNULL(MAX(p.OrderNo), 0) + 1
      FROM dbo.Patients p WITH (UPDLOCK, HOLDLOCK)
      WHERE p.IdClinica = @IdClinica;

      INSERT INTO dbo.ClinicOrderCounters (ClinicId, NextOrderNo, UpdatedAt)
      VALUES (@IdClinica, @OrderNo + 1, SYSDATETIME());
    END

    IF EXISTS (SELECT 1 FROM @ProductsToDiscount)
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM @ProductsToDiscount p
        LEFT JOIN dbo.InventoryProducts i WITH (UPDLOCK, HOLDLOCK)
          ON i.ProductId = p.ProductId
         AND i.IdClinica = p.IdClinica
        WHERE i.ProductId IS NULL
      )
      BEGIN
        THROW 50025, 'Uno o mas productos no existen para la clinica indicada.', 1;
      END

      IF EXISTS (
        SELECT 1
        FROM @ProductsToDiscount p
        INNER JOIN dbo.InventoryProducts i WITH (UPDLOCK, HOLDLOCK)
          ON i.ProductId = p.ProductId
         AND i.IdClinica = p.IdClinica
        WHERE ISNULL(i.Existencia, 0) < p.Cantidad
      )
      BEGIN
        THROW 50026, 'Existencia insuficiente para uno o mas productos.', 1;
      END
    END

    INSERT INTO dbo.Patients(
      OrderNo, ExamDate, Name, Address, Profession, Phone, Optometrist, IdClinica,
      IsFirstExam, UsesRx, HasDiabetes, HasBlindness, HasHypertension,
      HasCefalea, HasArdorOcular, HasDolorOcular, HasPrurito, HasFotofobia, HasBlindness2, HasVisionBorrosa, HasSecreciones,
      OD_Sphere_Lensometry, OD_Cyl_Lensometry, OD_Axis_Lensometry, OD_Add_Lensometry,
      OI_Sphere_Lensometry, OI_Cyl_Lensometry, OI_Axis_Lensometry, OI_Add_Lensometry,
      AV_OD_20, PH_OD_20, CC_OD_20, AV_OI_20, PH_OI_20, CC_OI_20,
      Auto_OD_Sphere, Auto_OD_Cyl, Auto_OD_Axis, Auto_OI_Sphere, Auto_OI_Cyl, Auto_OI_Axis,
      Rx_OD_Sphere, Rx_OD_Cyl, Rx_OD_Axis, Rx_OD_Add, Rx_OD_Alt,
      Rx_OI_Sphere, Rx_OI_Cyl, Rx_OI_Axis, Rx_OI_Add, Rx_OI_Alt,
      Frame, Dip, Material, Lens, Treatment, Products,
      Total, Deposit, Balance, PaymentMethod, Comments,
      CreatedByUserId
    )
    VALUES(
      @OrderNo, @ExamDate, @Name, @Address, @Profession, @Phone, @Optometrist, @IdClinica,
      @IsFirstExam, @UsesRx, @HasDiabetes, @HasBlindness, @HasHypertension,
      @HasCefalea, @HasArdorOcular, @HasDolorOcular, @HasPrurito, @HasFotofobia, @HasBlindness2, @HasVisionBorrosa, @HasSecreciones,
      @OD_Sphere_Lensometry, @OD_Cyl_Lensometry, @OD_Axis_Lensometry, @OD_Add_Lensometry,
      @OI_Sphere_Lensometry, @OI_Cyl_Lensometry, @OI_Axis_Lensometry, @OI_Add_Lensometry,
      @AV_OD_20, @PH_OD_20, @CC_OD_20, @AV_OI_20, @PH_OI_20, @CC_OI_20,
      @Auto_OD_Sphere, @Auto_OD_Cyl, @Auto_OD_Axis, @Auto_OI_Sphere, @Auto_OI_Cyl, @Auto_OI_Axis,
      @Rx_OD_Sphere, @Rx_OD_Cyl, @Rx_OD_Axis, @Rx_OD_Add, @Rx_OD_Alt,
      @Rx_OI_Sphere, @Rx_OI_Cyl, @Rx_OI_Axis, @Rx_OI_Add, @Rx_OI_Alt,
      @Frame, @Dip, @Material, @Lens, @Treatment, @ProductsJson,
      @Total, @Deposit, @Balance, @PaymentMethod, @Comments,
      @CreatedByUserId
    );

    SET @PatientId = SCOPE_IDENTITY();

    IF EXISTS (SELECT 1 FROM @ProductsToDiscount)
    BEGIN
      UPDATE i
      SET i.Existencia = i.Existencia - p.Cantidad,
          i.UpdatedAt = SYSDATETIME()
      FROM dbo.InventoryProducts i
      INNER JOIN @ProductsToDiscount p
        ON p.ProductId = i.ProductId
       AND p.IdClinica = i.IdClinica;

      IF @@ROWCOUNT <> (SELECT COUNT(1) FROM @ProductsToDiscount)
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
      Profession,
      IdClinica,
      Products
  FROM dbo.Patients
  WHERE PatientId = @PatientId;
END
GO

CREATE OR ALTER PROC [dbo].[spPatients_GetByOrderNo]
  @OrderNo INT,
  @IdClinica INT
AS
BEGIN
  SET NOCOUNT ON;

  IF @IdClinica IS NULL OR @IdClinica <= 0
  BEGIN
    THROW 50029, 'IdClinica es requerida para buscar por numero de orden.', 1;
  END

  SELECT TOP (1)
    p.*,
    c.Nombre AS NombreClinica,
    u.FullName AS NombreUsuario
  FROM dbo.Patients p
  LEFT JOIN dbo.Clinics c
    ON c.ClinicId = p.IdClinica
  LEFT JOIN dbo.Users u
    ON u.UserId = p.CreatedByUserId
  WHERE p.OrderNo = @OrderNo
    AND p.IdClinica = @IdClinica;
END
GO

CREATE OR ALTER PROC [dbo].[spPatients_Search]
  @Query NVARCHAR(200),
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @q NVARCHAR(200) = LTRIM(RTRIM(ISNULL(@Query,'')));
  DECLARE @ClinicsScope TABLE (ClinicId INT PRIMARY KEY);

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
  BEGIN
    THROW 50071, 'Rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado.', 1;
  END

  IF @Rol <> 'SuperAdmin' AND (@UserId IS NULL OR @UserId <= 0)
  BEGIN
    THROW 50072, 'UserId requerido para buscar pacientes segun clinicas autorizadas.', 1;
  END

  IF @IdClinica IS NULL OR @IdClinica < 0
  BEGIN
    THROW 50074, 'IdClinica invalido.', 1;
  END

  IF @Rol IN ('Administrador','Empleado')
  BEGIN
    ;WITH assigned AS
    (
      SELECT uc.ClinicId
      FROM dbo.UserClinics uc
      WHERE uc.UserId = @UserId
    ),
    fallbackPrimary AS
    (
      SELECT u.IdClinica AS ClinicId
      FROM dbo.Users u
      WHERE u.UserId = @UserId
        AND u.IdClinica IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM assigned)
    )
    INSERT INTO @ClinicsScope (ClinicId)
    SELECT ClinicId
    FROM assigned
    WHERE (@IdClinica = 0 OR ClinicId = @IdClinica)
    UNION
    SELECT ClinicId
    FROM fallbackPrimary
    WHERE (@IdClinica = 0 OR ClinicId = @IdClinica);

    IF @IdClinica > 0 AND NOT EXISTS (SELECT 1 FROM @ClinicsScope WHERE ClinicId = @IdClinica)
    BEGIN
      THROW 50073, 'El usuario no tiene autorizada la clinica indicada.', 1;
    END
  END

  IF @q = ''
  BEGIN
    SELECT TOP(50)
      p.PatientId,
      p.OrderNo,
      p.ExamDate,
      p.Name,
      p.Phone,
      p.Balance,
      p.DeliveredBy,
      p.IdClinica,
      c.Nombre AS NombreClinica
    FROM dbo.Patients p
    LEFT JOIN dbo.Clinics c
      ON c.ClinicId = p.IdClinica
    WHERE (
      (@Rol = 'SuperAdmin' AND (@IdClinica = 0 OR p.IdClinica = @IdClinica))
      OR (@Rol IN ('Administrador','Empleado') AND EXISTS (SELECT 1 FROM @ClinicsScope cs WHERE cs.ClinicId = p.IdClinica))
    )
    ORDER BY p.OrderNo DESC, p.IdClinica ASC;
    RETURN;
  END

  IF TRY_CONVERT(INT, @q) IS NOT NULL
  BEGIN
    DECLARE @o INT = TRY_CONVERT(INT, @q);

    SELECT TOP(50)
      p.PatientId,
      p.OrderNo,
      p.ExamDate,
      p.Name,
      p.Phone,
      p.Balance,
      p.DeliveredBy,
      p.IdClinica,
      c.Nombre AS NombreClinica
    FROM dbo.Patients p
    LEFT JOIN dbo.Clinics c
      ON c.ClinicId = p.IdClinica
    WHERE p.OrderNo = @o
      AND (
        (@Rol = 'SuperAdmin' AND (@IdClinica = 0 OR p.IdClinica = @IdClinica))
        OR (@Rol IN ('Administrador','Empleado') AND EXISTS (SELECT 1 FROM @ClinicsScope cs WHERE cs.ClinicId = p.IdClinica))
      )
    ORDER BY p.OrderNo DESC, p.IdClinica ASC;
    RETURN;
  END

  SELECT TOP(50)
    p.PatientId,
    p.OrderNo,
    p.ExamDate,
    p.Name,
    p.Phone,
    p.Balance,
    p.DeliveredBy,
    p.IdClinica,
    c.Nombre AS NombreClinica
  FROM dbo.Patients p
  LEFT JOIN dbo.Clinics c
    ON c.ClinicId = p.IdClinica
  WHERE (p.Name LIKE '%' + @q + '%'
     OR p.Phone LIKE '%' + @q + '%')
    AND (
      (@Rol = 'SuperAdmin' AND (@IdClinica = 0 OR p.IdClinica = @IdClinica))
      OR (@Rol IN ('Administrador','Empleado') AND EXISTS (SELECT 1 FROM @ClinicsScope cs WHERE cs.ClinicId = p.IdClinica))
    )
  ORDER BY p.OrderNo DESC, p.IdClinica ASC;
END
GO

CREATE OR ALTER PROC [dbo].[spPatients_Update]
  @PatientId INT,
  @ExamDate DATE,
  @Name NVARCHAR(150),
  @Address NVARCHAR(200)=NULL,
  @Profession NVARCHAR(120)=NULL,
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
      Profession = @Profession,
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
      Profession,
      IdClinica,
      Products
  FROM dbo.Patients
  WHERE PatientId = @PatientId;
END
GO

CREATE OR ALTER PROC [dbo].[spRpt_Orders_List]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @DateFrom DATE = NULL,
  @DateTo   DATE = NULL,
  @Query NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51101, 'Rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado.', 1;

  IF @DateFrom IS NULL SET @DateFrom = DATEADD(DAY, -30, CONVERT(DATE, SYSDATETIME()));
  IF @DateTo   IS NULL SET @DateTo   = CONVERT(DATE, SYSDATETIME());

  DECLARE @q NVARCHAR(200) = LTRIM(RTRIM(ISNULL(@Query,'')));

  IF @Rol = 'Empleado' AND (@UserId IS NULL OR @IdClinica <= 0)
    THROW 51102, 'Empleado requiere UserId e IdClinica (>0).', 1;

  IF @Rol = 'Administrador' AND @UserId IS NULL
    THROW 51103, 'Administrador requiere UserId.', 1;

  DECLARE @ClinicsScope TABLE (ClinicId INT PRIMARY KEY);

  IF @Rol = 'Administrador'
  BEGIN
    IF @IdClinica > 0
       AND NOT EXISTS (SELECT 1 FROM dbo.UserClinics WHERE UserId=@UserId AND ClinicId=@IdClinica)
      THROW 51104, 'El usuario no tiene asignada la clinica indicada.', 1;

    INSERT INTO @ClinicsScope(ClinicId)
    SELECT uc.ClinicId
    FROM dbo.UserClinics uc
    WHERE uc.UserId = @UserId
      AND (@IdClinica = 0 OR uc.ClinicId = @IdClinica);
  END

  SELECT
      p.PatientId                AS [PatientId],
      p.IdClinica                AS [IdClinica],
      p.OrderNo                  AS [NoOrden],
      p.ExamDate                 AS [Fecha],
      p.Name                     AS [Paciente],
      u.FullName                 AS [Optometrista],
      p.LabCode                  AS [CodLab],
      p.Total                    AS [Total],
      p.Deposit                  AS [Anticipo],
      p.Balance                  AS [Saldo],
      c.Codigo                   AS [CodClinica],
      c.Nombre                   AS [Clinica]
  FROM dbo.Patients p
  LEFT JOIN dbo.Users u
    ON u.UserId = p.CreatedByUserId
  LEFT JOIN dbo.Clinics c
    ON c.ClinicId = p.IdClinica
  WHERE p.ExamDate BETWEEN @DateFrom AND @DateTo
    AND (
        @q = ''
        OR (TRY_CONVERT(INT, @q) IS NOT NULL AND p.OrderNo = TRY_CONVERT(INT, @q))
        OR p.Name  LIKE '%' + @q + '%'
        OR p.Phone LIKE '%' + @q + '%'
    )
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR p.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND EXISTS (SELECT 1 FROM @ClinicsScope cs WHERE cs.ClinicId = p.IdClinica))
      OR (@Rol='Empleado' AND p.IdClinica=@IdClinica AND p.CreatedByUserId=@UserId)
    )
  ORDER BY p.OrderNo DESC, p.IdClinica ASC;
END
GO
