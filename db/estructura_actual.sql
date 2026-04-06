USE [OPT_CRISTAL_DB]
GO
/****** Object:  Table [dbo].[Clinics]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Clinics](
	[ClinicId] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [nvarchar](50) NOT NULL,
	[Nombre] [nvarchar](150) NOT NULL,
	[Estado] [bit] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[Logo] [text] NULL,
	[telefono] [bigint] NULL,
PRIMARY KEY CLUSTERED 
(
	[ClinicId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ClinicOrderCounters]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ClinicOrderCounters](
	[ClinicId] [int] NOT NULL,
	[NextOrderNo] [int] NOT NULL,
	[UpdatedAt] [datetime2](0) NOT NULL,
 CONSTRAINT [PK_ClinicOrderCounters] PRIMARY KEY CLUSTERED 
(
	[ClinicId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [CK_ClinicOrderCounters_NextOrderNo] CHECK  (([NextOrderNo]>(0)))
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Expenses]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Expenses](
	[ExpenseId] [int] IDENTITY(1,1) NOT NULL,
	[ExpenseDate] [date] NOT NULL,
	[Description] [nvarchar](220) NOT NULL,
	[Amount] [decimal](10, 2) NOT NULL,
	[UserName] [nvarchar](80) NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedByUserId] [int] NULL,
	[IdClinica] [int] NULL,
	[Quantity] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ExpenseId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[InventoryProducts]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InventoryProducts](
	[ProductId] [int] IDENTITY(1,1) NOT NULL,
	[Codigo] [nvarchar](50) NOT NULL,
	[Costo_Compra] [money] NULL,
	[Costo_Venta] [money] NULL,
	[Existencia] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[NombreProducto] [nvarchar](150) NULL,
	[IdClinica] [int] NULL,
 CONSTRAINT [PK_InventoryProducts] PRIMARY KEY CLUSTERED 
(
	[ProductId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_InventoryProducts_Codigo] UNIQUE NONCLUSTERED 
(
	[Codigo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Patients]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Patients](
	[PatientId] [int] IDENTITY(1,1) NOT NULL,
	[OrderNo] [int] NOT NULL,
	[ExamDate] [date] NOT NULL,
	[Name] [nvarchar](150) NOT NULL,
	[Address] [nvarchar](200) NULL,
	[Phone] [nvarchar](30) NULL,
	[Optometrist] [nvarchar](50) NULL,
	[IsFirstExam] [bit] NULL,
	[UsesRx] [bit] NULL,
	[HasDiabetes] [bit] NULL,
	[HasBlindness] [bit] NULL,
	[HasHypertension] [bit] NULL,
	[HasCefalea] [bit] NULL,
	[HasArdorOcular] [bit] NULL,
	[HasDolorOcular] [bit] NULL,
	[HasPrurito] [bit] NULL,
	[HasFotofobia] [bit] NULL,
	[HasBlindness2] [bit] NULL,
	[HasVisionBorrosa] [bit] NULL,
	[HasSecreciones] [bit] NULL,
	[OD_Sphere_Lensometry] [nvarchar](20) NULL,
	[OD_Cyl_Lensometry] [nvarchar](20) NULL,
	[OD_Axis_Lensometry] [nvarchar](20) NULL,
	[OD_Add_Lensometry] [nvarchar](20) NULL,
	[OI_Sphere_Lensometry] [nvarchar](20) NULL,
	[OI_Cyl_Lensometry] [nvarchar](20) NULL,
	[OI_Axis_Lensometry] [nvarchar](20) NULL,
	[OI_Add_Lensometry] [nvarchar](20) NULL,
	[AV_OD_20] [nvarchar](20) NULL,
	[PH_OD_20] [nvarchar](20) NULL,
	[CC_OD_20] [nvarchar](20) NULL,
	[AV_OI_20] [nvarchar](20) NULL,
	[PH_OI_20] [nvarchar](20) NULL,
	[CC_OI_20] [nvarchar](20) NULL,
	[Auto_OD_Sphere] [nvarchar](20) NULL,
	[Auto_OD_Cyl] [nvarchar](20) NULL,
	[Auto_OD_Axis] [nvarchar](20) NULL,
	[Auto_OI_Sphere] [nvarchar](20) NULL,
	[Auto_OI_Cyl] [nvarchar](20) NULL,
	[Auto_OI_Axis] [nvarchar](20) NULL,
	[Rx_OD_Sphere] [nvarchar](20) NULL,
	[Rx_OD_Cyl] [nvarchar](20) NULL,
	[Rx_OD_Axis] [nvarchar](20) NULL,
	[Rx_OD_Add] [nvarchar](20) NULL,
	[Rx_OD_Alt] [nvarchar](20) NULL,
	[Rx_OI_Sphere] [nvarchar](20) NULL,
	[Rx_OI_Cyl] [nvarchar](20) NULL,
	[Rx_OI_Axis] [nvarchar](20) NULL,
	[Rx_OI_Add] [nvarchar](20) NULL,
	[Rx_OI_Alt] [nvarchar](20) NULL,
	[Frame] [nvarchar](80) NULL,
	[Dip] [nvarchar](30) NULL,
	[Material] [nvarchar](80) NULL,
	[Lens] [nvarchar](120) NULL,
	[Treatment] [nvarchar](120) NULL,
	[Total] [decimal](10, 2) NULL,
	[Deposit] [decimal](10, 2) NULL,
	[Balance] [decimal](10, 2) NULL,
	[PaymentMethod] [nvarchar](30) NULL,
	[Comments] [nvarchar](500) NULL,
	[LabCode] [nvarchar](50) NULL,
	[DeliveredBy] [nvarchar](80) NULL,
	[DeliveryDate] [date] NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[CreatedByUserId] [int] NULL,
	[UpdatedAt] [datetime2](0) NULL,
	[UpdatedByUserId] [int] NULL,
	[IdClinica] [int] NULL,
	[Products] [text] NULL,
PRIMARY KEY CLUSTERED 
(
	[PatientId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Quotations]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Quotations](
	[QuotationId] [int] IDENTITY(1,1) NOT NULL,
	[QuoteDate] [datetime2](0) NOT NULL,
	[Name] [nvarchar](150) NULL,
	[Phone] [nvarchar](30) NULL,
	[Optometrist] [nvarchar](50) NULL,
	[Frame] [nvarchar](120) NULL,
	[Lens] [nvarchar](150) NULL,
	[Treatment] [nvarchar](150) NULL,
	[Total] [decimal](10, 2) NULL,
	[CreatedByUserId] [int] NULL,
	[IdClinica] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[QuotationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserClinics]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserClinics](
	[UserClinicId] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[ClinicId] [int] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UserClinicId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[UserId] [int] IDENTITY(1,1) NOT NULL,
	[Username] [nvarchar](60) NOT NULL,
	[PasswordHash] [nvarchar](255) NOT NULL,
	[FullName] [nvarchar](120) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](0) NOT NULL,
	[IdClinica] [int] NULL,
	[Rol] [nvarchar](20) NOT NULL,
	[ChangePassword] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Clinics] ADD  CONSTRAINT [DF_Clinics_Estado]  DEFAULT ((1)) FOR [Estado]
GO
ALTER TABLE [dbo].[Clinics] ADD  CONSTRAINT [DF_Clinics_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ClinicOrderCounters] ADD  CONSTRAINT [DF_ClinicOrderCounters_UpdatedAt]  DEFAULT (sysdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Expenses] ADD  CONSTRAINT [DF_Expenses_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Expenses] ADD  CONSTRAINT [DF_Expenses_Quantity]  DEFAULT ((1)) FOR [Quantity]
GO
ALTER TABLE [dbo].[InventoryProducts] ADD  CONSTRAINT [DF_InventoryProducts_Existencia]  DEFAULT ((0)) FOR [Existencia]
GO
ALTER TABLE [dbo].[InventoryProducts] ADD  CONSTRAINT [DF_InventoryProducts_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Patients] ADD  CONSTRAINT [DF_Patients_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Quotations] ADD  CONSTRAINT [DF_Quotations_QuoteDate]  DEFAULT (sysdatetime()) FOR [QuoteDate]
GO
ALTER TABLE [dbo].[UserClinics] ADD  CONSTRAINT [DF_UserClinics_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_Rol]  DEFAULT ('Empleado') FOR [Rol]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((1)) FOR [ChangePassword]
GO
ALTER TABLE [dbo].[Expenses]  WITH CHECK ADD  CONSTRAINT [FK_Expenses_Clinics] FOREIGN KEY([IdClinica])
REFERENCES [dbo].[Clinics] ([ClinicId])
GO
ALTER TABLE [dbo].[Expenses] CHECK CONSTRAINT [FK_Expenses_Clinics]
GO
ALTER TABLE [dbo].[ClinicOrderCounters]  WITH CHECK ADD  CONSTRAINT [FK_ClinicOrderCounters_Clinics] FOREIGN KEY([ClinicId])
REFERENCES [dbo].[Clinics] ([ClinicId])
GO
ALTER TABLE [dbo].[ClinicOrderCounters] CHECK CONSTRAINT [FK_ClinicOrderCounters_Clinics]
GO
ALTER TABLE [dbo].[InventoryProducts]  WITH CHECK ADD  CONSTRAINT [FK_InventoryProducts_Clinics] FOREIGN KEY([IdClinica])
REFERENCES [dbo].[Clinics] ([ClinicId])
GO
ALTER TABLE [dbo].[InventoryProducts] CHECK CONSTRAINT [FK_InventoryProducts_Clinics]
GO
ALTER TABLE [dbo].[Patients]  WITH CHECK ADD  CONSTRAINT [FK_Patients_Clinics] FOREIGN KEY([IdClinica])
REFERENCES [dbo].[Clinics] ([ClinicId])
GO
ALTER TABLE [dbo].[Patients] CHECK CONSTRAINT [FK_Patients_Clinics]
GO
ALTER TABLE [dbo].[Quotations]  WITH CHECK ADD  CONSTRAINT [FK_Quotations_Clinics] FOREIGN KEY([IdClinica])
REFERENCES [dbo].[Clinics] ([ClinicId])
GO
ALTER TABLE [dbo].[Quotations] CHECK CONSTRAINT [FK_Quotations_Clinics]
GO
ALTER TABLE [dbo].[UserClinics]  WITH CHECK ADD  CONSTRAINT [FK_UserClinics_Clinics] FOREIGN KEY([ClinicId])
REFERENCES [dbo].[Clinics] ([ClinicId])
GO
ALTER TABLE [dbo].[UserClinics] CHECK CONSTRAINT [FK_UserClinics_Clinics]
GO
ALTER TABLE [dbo].[UserClinics]  WITH CHECK ADD  CONSTRAINT [FK_UserClinics_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
ALTER TABLE [dbo].[UserClinics] CHECK CONSTRAINT [FK_UserClinics_Users]
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD  CONSTRAINT [CK_Users_Rol] CHECK  (([Rol]='Empleado' OR [Rol]='Administrador' OR [Rol]='SuperAdmin'))
GO
ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [CK_Users_Rol]
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Patients_IdClinica_OrderNo] ON [dbo].[Patients]
(
	[IdClinica] ASC,
	[OrderNo] ASC
)
WHERE ([IdClinica] IS NOT NULL)
GO
/****** Object:  StoredProcedure [dbo].[spAuth_GetUserByUsername]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spAuth_GetUserByUsername]
  @Username NVARCHAR(60)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP(1)
    UserId,
    Username,
    PasswordHash,
    FullName,
    IsActive,
    Rol
  FROM dbo.Users
  WHERE Username = @Username;
END
GO
/****** Object:  StoredProcedure [dbo].[spClinics_Create]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROC [dbo].[spClinics_Create]
    @Codigo NVARCHAR(50),
    @Nombre NVARCHAR(150),
    @Estado BIT = 1,
    @Logo TEXT,
    @Telefono bigint
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
        ClinicId, Codigo, Nombre, Estado,telefono, CreatedAt, UpdatedAt
    FROM dbo.Clinics
    WHERE ClinicId = @ClinicId;
END

GO
/****** Object:  StoredProcedure [dbo].[spClinics_Update]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spClinics_Update]
    @ClinicId INT,
    @Codigo NVARCHAR(50),
    @Nombre NVARCHAR(150),
    @Estado BIT = 1,
    @Logo TEXT,
    @Telefono bigint
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @ClinicId)
        THROW 50101, 'La clínica no existe.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.Clinics
        WHERE Codigo = @Codigo
          AND ClinicId <> @ClinicId
    )
        THROW 50102, 'Ya existe otra clínica con ese Codigo.', 1;

    UPDATE dbo.Clinics
    SET
        Codigo = @Codigo,
        Nombre = @Nombre,
        Estado = @Estado,
        Logo = @Logo,
        telefono = @Telefono,
        UpdatedAt = GETDATE()
    WHERE ClinicId = @ClinicId;

    SELECT TOP(1)
        ClinicId, Codigo, Nombre, Estado, CreatedAt, telefono, UpdatedAt
    FROM dbo.Clinics
    WHERE ClinicId = @ClinicId;
END
GO
/****** Object:  StoredProcedure [dbo].[spDashboard_Summary]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROC [dbo].[spDashboard_Summary]
    @Rol      NVARCHAR(20),
    @UserId   INT = NULL,
    @IdClinic INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Rol NOT IN ('SuperAdmin', 'Administrador', 'Empleado')
        THROW 50040, 'Rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado.', 1;

    /* =========================
       SUPERADMIN
    ========================= */
    IF @Rol = 'SuperAdmin'
    BEGIN
        SELECT
            COUNT(1) AS TotalPatients,
            SUM(CASE WHEN DeliveredBy IS NULL OR LTRIM(RTRIM(DeliveredBy))='' THEN 1 ELSE 0 END) AS PendingDeliveries,
            SUM(CASE WHEN ISNULL(Balance,0) > 0 THEN Balance ELSE 0 END) AS PendingBalance,
            CAST(NULL AS INT) AS IdClinica,
            CASE WHEN ISNULL(@IdClinic,0) = 0 THEN N'Todas'
                 ELSE (SELECT TOP(1) Nombre FROM dbo.Clinics WHERE ClinicId = @IdClinic)
            END AS NombreClinica
        FROM dbo.Patients p
        WHERE (ISNULL(@IdClinic,0) = 0 OR p.IdClinica = @IdClinic);

        SELECT TOP(15)
            p.PatientId, p.OrderNo, p.ExamDate, p.Name, p.Phone, p.Balance, p.LabCode,
            p.IdClinica, c.Nombre AS NombreClinica
        FROM dbo.Patients p
        LEFT JOIN dbo.Clinics c ON c.ClinicId = p.IdClinica
        WHERE (p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='')
          AND (ISNULL(@IdClinic,0) = 0 OR p.IdClinica = @IdClinic)
        ORDER BY p.OrderNo DESC;

        RETURN;
    END

    /* =========================
       ADMINISTRADOR
    ========================= */
    IF @Rol = 'Administrador'
    BEGIN
        set @IdClinic = 0;

        IF @UserId IS NULL
            THROW 50041, 'Administrador requiere UserId.', 1;

        IF ISNULL(@IdClinic,0) > 0
           AND NOT EXISTS (SELECT 1 FROM dbo.UserClinics WHERE UserId = @UserId AND ClinicId = @IdClinic)
            THROW 50042, 'El usuario no tiene asignada la clinica indicada.', 1;

        DECLARE @ClinicsScope TABLE (ClinicId INT PRIMARY KEY);

        INSERT INTO @ClinicsScope(ClinicId)
        SELECT uc.ClinicId
        FROM dbo.UserClinics uc
        WHERE uc.UserId = @UserId
          AND (ISNULL(@IdClinic,0) = 0 OR uc.ClinicId = @IdClinic);

        -- Resumen por clínica (mantengo IdClinica para identificar cada fila)
        SELECT
            p.IdClinica,
            c.Nombre AS NombreClinica,
            COUNT(1) AS TotalPatients,
            SUM(CASE WHEN p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='' THEN 1 ELSE 0 END) AS PendingDeliveries,
            SUM(CASE WHEN ISNULL(p.Balance,0) > 0 THEN p.Balance ELSE 0 END) AS PendingBalance
        FROM dbo.Patients p
        INNER JOIN @ClinicsScope cs ON cs.ClinicId = p.IdClinica
        LEFT JOIN dbo.Clinics c ON c.ClinicId = p.IdClinica
        GROUP BY p.IdClinica, c.Nombre
        ORDER BY c.Nombre;

        SELECT TOP(15)
            p.PatientId, p.OrderNo, p.ExamDate, p.Name, p.Phone, p.Balance, p.LabCode,
            p.IdClinica, c.Nombre AS NombreClinica
        FROM dbo.Patients p
        INNER JOIN @ClinicsScope cs ON cs.ClinicId = p.IdClinica
        LEFT JOIN dbo.Clinics c ON c.ClinicId = p.IdClinica
        WHERE (p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='')
        ORDER BY p.OrderNo DESC;

        RETURN;
    END

    /* =========================
       EMPLEADO
    ========================= */
    IF @UserId IS NULL OR @IdClinic IS NULL OR @IdClinic <= 0
        THROW 50043, 'Empleado requiere UserId e IdClinic valido (>0).', 1;

    SELECT
        COUNT(1) AS TotalPatients,
        SUM(CASE WHEN p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='' THEN 1 ELSE 0 END) AS PendingDeliveries,
        SUM(CASE WHEN ISNULL(p.Balance,0) > 0 THEN p.Balance ELSE 0 END) AS PendingBalance,
        @IdClinic AS IdClinica,
        (SELECT TOP(1) Nombre FROM dbo.Clinics WHERE ClinicId = @IdClinic) AS NombreClinica
    FROM dbo.Patients p
    WHERE p.CreatedByUserId = @UserId
      AND p.IdClinica = @IdClinic;

    SELECT TOP(15)
        p.PatientId, p.OrderNo, p.ExamDate, p.Name, p.Phone, p.Balance, p.LabCode,
        p.IdClinica, c.Nombre AS NombreClinica
    FROM dbo.Patients p
    LEFT JOIN dbo.Clinics c ON c.ClinicId = p.IdClinica
    WHERE (p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='')
      AND p.CreatedByUserId = @UserId
      AND p.IdClinica = @IdClinic
    ORDER BY p.OrderNo DESC;
END
GO
/****** Object:  StoredProcedure [dbo].[spExpenses_Create]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spExpenses_Create]
      @ExpenseDate DATE,
      @Description NVARCHAR(220),
      @Amount DECIMAL(10,2),
      @UserName NVARCHAR(80),
      @IdClinica INT = NULL,
      @Quantity INT = 1,
      @CreatedByUserId INT=NULL
    AS
    BEGIN
      SET NOCOUNT ON;

      -- Validar Quantity
      IF @Quantity IS NULL OR @Quantity <= 0
          THROW 52001, 'Quantity debe ser mayor a 0.', 1;

      -- Validar clínica si viene valor
      IF @IdClinica IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @IdClinica)
      BEGIN
          THROW 52002, 'La clinica enviada no existe.', 1;
      END

      INSERT INTO dbo.Expenses(ExpenseDate, Description, Amount, UserName, IdClinica, Quantity, CreatedByUserId)
      VALUES(@ExpenseDate, @Description, @Amount, @UserName, @IdClinica, @Quantity, @CreatedByUserId);

      SELECT TOP(1)
          ExpenseId,
          ExpenseDate,
          Description,
          Amount,
          UserName,
          IdClinica,
          Quantity,
          CreatedAt,
          CreatedByUserId
      FROM dbo.Expenses
      WHERE ExpenseId = SCOPE_IDENTITY();
    END
GO
/****** Object:  StoredProcedure [dbo].[spExpenses_List]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spExpenses_List]
  @Take INT=50,
  @IdUser int
AS
BEGIN
  SET NOCOUNT ON;

  declare @rol nvarchar(64)
  select @rol = Rol from Users where UserId = @IdUser

  IF @rol = 'Administrador'
  begin
   
      SELECT TOP(@Take)
        e.ExpenseId, e.ExpenseDate, e.Description, e.Amount, e.UserName, e.IdClinica, c.Codigo, c.Nombre
      FROM dbo.Expenses e
      left outer join dbo.Clinics c on c.ClinicId = e.IdClinica

      where c.ClinicId in (select ClinicId from UserClinics where UserId = @IdUser)

      ORDER BY e.ExpenseId DESC;

  end
  else begin

    SELECT TOP(@Take)
    e.ExpenseId, e.ExpenseDate, e.Description, e.Amount, e.UserName, e.IdClinica, c.Codigo, c.Nombre
    FROM dbo.Expenses e
    left outer join dbo.Clinics c on c.ClinicId = e.IdClinica
    ORDER BY e.ExpenseId DESC;

  end


 
END

GO
/****** Object:  StoredProcedure [dbo].[spInventory_Create]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spInventory_Create]
    @Codigo         NVARCHAR(50),
    @NombreProducto NVARCHAR(150) = NULL,
    @Costo_Compra   MONEY = NULL,
    @Costo_Venta    MONEY = NULL,
    @Existencia     INT = 0,
    @IdClinica      INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @IdClinica IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @IdClinica)
    BEGIN
        THROW 50017, 'La clinica enviada no existe.', 1;
    END

    IF EXISTS (
        SELECT 1
        FROM dbo.InventoryProducts
        WHERE Codigo = @Codigo
          AND (
                (@IdClinica IS NULL AND IdClinica IS NULL)
                OR IdClinica = @IdClinica
              )
    )
    BEGIN
        THROW 50010, 'Ya existe un producto con ese codigo para esa clinica.', 1;
    END

    IF @Existencia IS NULL OR @Existencia < 0
        SET @Existencia = 0;

    INSERT INTO dbo.InventoryProducts
    (
        Codigo,
        NombreProducto,
        Costo_Compra,
        Costo_Venta,
        Existencia,
        IdClinica
    )
    VALUES
    (
        @Codigo,
        @NombreProducto,
        @Costo_Compra,
        @Costo_Venta,
        @Existencia,
        @IdClinica
    );

    SELECT TOP (1) *
    FROM dbo.InventoryProducts
    WHERE ProductId = SCOPE_IDENTITY();
END

GO
/****** Object:  StoredProcedure [dbo].[spInventory_Decrement]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROC [dbo].[spInventory_Decrement]
    @ProductId INT,
    @Cantidad  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Cantidad IS NULL OR @Cantidad <= 0
        THROW 50013, 'Cantidad a rebajar debe ser mayor a 0.', 1;

    BEGIN TRAN;

        UPDATE dbo.InventoryProducts
        SET Existencia = Existencia - @Cantidad,
            UpdatedAt  = SYSDATETIME()
        WHERE ProductId = @ProductId
          AND Existencia >= @Cantidad;

        IF @@ROWCOUNT = 0
        BEGIN
            ROLLBACK;
            THROW 50014, 'No se pudo rebajar: producto no existe o existencia insuficiente.', 1;
        END

    COMMIT;

    SELECT TOP (1) *
    FROM dbo.InventoryProducts
    WHERE ProductId = @ProductId;
END

GO
/****** Object:  StoredProcedure [dbo].[spInventory_Update]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spInventory_Update]
    @ProductId      INT,
    @Codigo         NVARCHAR(50) = NULL,
    @NombreProducto NVARCHAR(150) = NULL,
    @Costo_Compra   MONEY = NULL,
    @Costo_Venta    MONEY = NULL,
    @Existencia     INT = NULL,
    @IdClinica      INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.InventoryProducts WHERE ProductId = @ProductId)
    BEGIN
        THROW 50011, 'Producto no existe.', 1;
    END

    IF @IdClinica IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @IdClinica)
    BEGIN
        THROW 50017, 'La clinica enviada no existe.', 1;
    END

    IF @Existencia IS NOT NULL AND @Existencia < 0
    BEGIN
        THROW 50013, 'Existencia no puede ser negativa.', 1;
    END

    DECLARE @CodigoFinal NVARCHAR(50);
    DECLARE @IdClinicaFinal INT;

    SELECT
        @CodigoFinal = COALESCE(@Codigo, Codigo),
        @IdClinicaFinal = COALESCE(@IdClinica, IdClinica)
    FROM dbo.InventoryProducts
    WHERE ProductId = @ProductId;

    IF EXISTS (
        SELECT 1
        FROM dbo.InventoryProducts
        WHERE Codigo = @CodigoFinal
          AND (
                (@IdClinicaFinal IS NULL AND IdClinica IS NULL)
                OR IdClinica = @IdClinicaFinal
              )
          AND ProductId <> @ProductId
    )
    BEGIN
        THROW 50012, 'Ya existe otro producto con ese codigo para esa clinica.', 1;
    END

    UPDATE dbo.InventoryProducts
    SET
        Codigo         = COALESCE(@Codigo, Codigo),
        NombreProducto = COALESCE(@NombreProducto, NombreProducto),
        Costo_Compra   = COALESCE(@Costo_Compra, Costo_Compra),
        Costo_Venta    = COALESCE(@Costo_Venta, Costo_Venta),
        Existencia     = COALESCE(@Existencia, Existencia),
        IdClinica      = COALESCE(@IdClinica, IdClinica),
        UpdatedAt      = SYSDATETIME()
    WHERE ProductId = @ProductId;

    SELECT TOP (1) *
    FROM dbo.InventoryProducts
    WHERE ProductId = @ProductId;
END
GO
/****** Object:  StoredProcedure [dbo].[spPatients_AssignLabCode]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_AssignLabCode]
  @PatientId INT
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS(SELECT 1 FROM dbo.Patients WHERE PatientId=@PatientId AND LabCode IS NOT NULL AND LTRIM(RTRIM(LabCode)) <> '')
  BEGIN
    SELECT CAST(1 AS BIT) AS HasError, N'Este paciente ya tiene código de laboratorio asignado.' AS ErrorMessage, NULL AS AssignedLabCode;
    RETURN;
  END

  DECLARE @code INT = NEXT VALUE FOR dbo.SeqLabCode;

  UPDATE dbo.Patients
  SET LabCode = CAST(@code AS NVARCHAR(50)),
      UpdatedAt = SYSDATETIME()
  WHERE PatientId = @PatientId;

  SELECT CAST(0 AS BIT) AS HasError, NULL AS ErrorMessage, CAST(@code AS NVARCHAR(50)) AS AssignedLabCode;
END

GO
/****** Object:  StoredProcedure [dbo].[spPatients_ConfirmDelivery]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_ConfirmDelivery]
  @PatientId INT,
  @DeliveredBy NVARCHAR(80),
  @UpdatedByUserId INT=NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS(SELECT 1 FROM dbo.Patients WHERE PatientId=@PatientId AND DeliveredBy IS NOT NULL AND LTRIM(RTRIM(DeliveredBy)) <> '')
  BEGIN
    SELECT CAST(1 AS BIT) AS HasError, N'Esta orden ya fue entregada.' AS ErrorMessage;
    RETURN;
  END

  UPDATE dbo.Patients
  SET DeliveredBy = @DeliveredBy,
      DeliveryDate = CONVERT(DATE, SYSDATETIME()),
      Balance = 0,
      UpdatedAt = SYSDATETIME(),
      UpdatedByUserId = @UpdatedByUserId
  WHERE PatientId = @PatientId;

  SELECT CAST(0 AS BIT) AS HasError, NULL AS ErrorMessage;
END

GO
/****** Object:  StoredProcedure [dbo].[spPatients_Create]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_Create]
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

    IF @IdClinica IS NOT NULL
       AND EXISTS (
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
    SET @Balance = CASE WHEN @t-@d < 0 THEN 0 ELSE @t-@d END;
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
      OrderNo, ExamDate, Name, Address, Phone, Optometrist, IdClinica,
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
      @OrderNo, @ExamDate, @Name, @Address, @Phone, @Optometrist, @IdClinica,
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
      IdClinica,
      Products
  FROM dbo.Patients
  WHERE PatientId = @PatientId;
END

GO
/****** Object:  StoredProcedure [dbo].[spPatients_GetById]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_GetById]
  @PatientId INT,
  @IdClinica INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP(1)
    p.*,u.FullName
  FROM dbo.Patients p

  LEFT JOIN dbo.Users u 
    ON u.UserId = p.CreatedByUserId

  WHERE PatientId = @PatientId
    AND (@IdClinica = 0 OR p.IdClinica = @IdClinica);
END
GO
/****** Object:  StoredProcedure [dbo].[spPatients_GetByOrderNo]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_GetByOrderNo]
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
/****** Object:  StoredProcedure [dbo].[spPatients_Search]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_Search]
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
      p.PatientId, p.OrderNo, p.ExamDate, p.Name, p.Phone, p.Balance, p.DeliveredBy, p.IdClinica,
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
      p.PatientId, p.OrderNo, p.ExamDate, p.Name, p.Phone, p.Balance, p.DeliveredBy, p.IdClinica,
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
    p.PatientId, p.OrderNo, p.ExamDate, p.Name, p.Phone, p.Balance, p.DeliveredBy, p.IdClinica,
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
/****** Object:  StoredProcedure [dbo].[spPatients_Update]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_Update]
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

      IF @IdClinica IS NOT NULL
         AND EXISTS (
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
GO
/****** Object:  StoredProcedure [dbo].[spPatients_UpdateLabCode]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spPatients_UpdateLabCode]
  @PatientId INT,
  @LabCode NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;


  UPDATE dbo.Patients
  SET LabCode = @LabCode,
      UpdatedAt = SYSDATETIME()
  WHERE PatientId = @PatientId;

  SELECT CAST(0 AS BIT) AS HasError,
         NULL AS ErrorMessage;
END
GO
/****** Object:  StoredProcedure [dbo].[spQuitation_Delete]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create proc [dbo].[spQuitation_Delete]
(
    @idQuotation int
)
as
begin

    delete from Quotations where QuotationId = @idQuotation    
    select 'success'


end
GO
/****** Object:  StoredProcedure [dbo].[spQuotations_Create]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spQuotations_Create]
  @Name NVARCHAR(150)=NULL,
  @Phone NVARCHAR(30)=NULL,
  @Optometrist NVARCHAR(50)=NULL,
  @Frame NVARCHAR(120)=NULL,
  @Lens NVARCHAR(150)=NULL,
  @Treatment NVARCHAR(150)=NULL,
  @Total DECIMAL(10,2)=NULL,
  @IdClinica INT = NULL,
  @CreatedByUserId INT=NULL
AS
BEGIN
  SET NOCOUNT ON;

  -- Validar clínica si viene valor
  IF @IdClinica IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE ClinicId = @IdClinica)
  BEGIN
      THROW 50030, 'La clinica enviada no existe.', 1;
  END

  INSERT INTO dbo.Quotations(
      Name, Phone, Optometrist, Frame, Lens, Treatment, Total, IdClinica, CreatedByUserId
  )
  VALUES(
      @Name, @Phone, @Optometrist, @Frame, @Lens, @Treatment, @Total, @IdClinica, @CreatedByUserId
  );

  SELECT TOP(1)
      QuotationId,
      QuoteDate,
      Name,
      Phone,
      Optometrist,
      Frame,
      Lens,
      Treatment,
      Total,
      IdClinica,
      CreatedByUserId
  FROM dbo.Quotations
  WHERE QuotationId = SCOPE_IDENTITY();
END

GO
/****** Object:  StoredProcedure [dbo].[spQuotations_GetById]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spQuotations_GetById]
  @QuotationId INT,
  @IdClinica INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT TOP(1)
    QuotationId,
    QuoteDate,
    Name,
    Phone,
    Optometrist,
    Frame,
    Lens,
    Treatment,
    Total,
    IdClinica,
    CreatedByUserId
  FROM dbo.Quotations
  WHERE QuotationId = @QuotationId
    AND (@IdClinica = 0 OR IdClinica = @IdClinica);
END

GO
/****** Object:  StoredProcedure [dbo].[spQuotations_List]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spQuotations_List]
  @Take INT=30
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP(@Take)
    QuotationId, QuoteDate, Name, Phone, Optometrist, Frame, Lens, Treatment, Total
  FROM dbo.Quotations
  ORDER BY QuotationId DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spQuotations_Search]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROC [dbo].[spQuotations_Search]
  @Query NVARCHAR(200),
  @IdClinica INT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @q NVARCHAR(200) = LTRIM(RTRIM(ISNULL(@Query,'')));

  IF @q = ''
  BEGIN
    SELECT TOP(50)
      QuotationId,
      QuoteDate,
      Name,
      Phone,
      Optometrist,
      Frame,
      Lens,
      Treatment,
      Total,
      IdClinica
    FROM dbo.Quotations
    WHERE (@IdClinica = 0 OR IdClinica = @IdClinica)
    ORDER BY QuotationId DESC;
    RETURN;
  END

  IF TRY_CONVERT(INT, @q) IS NOT NULL
  BEGIN
    DECLARE @QuotationIdSearch INT = TRY_CONVERT(INT, @q);

    SELECT TOP(50)
      QuotationId,
      QuoteDate,
      Name,
      Phone,
      Optometrist,
      Frame,
      Lens,
      Treatment,
      Total,
      IdClinica
    FROM dbo.Quotations
    WHERE QuotationId = @QuotationIdSearch
      AND (@IdClinica = 0 OR IdClinica = @IdClinica)
    ORDER BY QuotationId DESC;
    RETURN;
  END

  SELECT TOP(50)
    QuotationId,
    QuoteDate,
    Name,
    Phone,
    Optometrist,
    Frame,
    Lens,
    Treatment,
    Total,
    IdClinica
  FROM dbo.Quotations
  WHERE (Name LIKE '%' + @q + '%'
      OR Phone LIKE '%' + @q + '%')
    AND (@IdClinica = 0 OR IdClinica = @IdClinica)
  ORDER BY QuotationId DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Expenses_ByDay]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--

CREATE   PROC [dbo].[spRpt_Expenses_ByDay]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @DateFrom DATE = NULL,
  @DateTo   DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51061, 'Rol invalido.', 1;

  IF @DateFrom IS NULL SET @DateFrom = DATEADD(DAY, -30, CONVERT(DATE, SYSDATETIME()));
  IF @DateTo   IS NULL SET @DateTo   = CONVERT(DATE, SYSDATETIME());

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51062, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51063, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT
    e.ExpenseDate,
    SUM(e.Amount) AS TotalGastos
  FROM dbo.Expenses e
  WHERE e.ExpenseDate BETWEEN @DateFrom AND @DateTo
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR EXISTS (SELECT 1 FROM dbo.UserClinics uc WHERE uc.UserId=e.CreatedByUserId AND uc.ClinicId=@IdClinica)))
      OR (@Rol='Administrador' AND EXISTS (SELECT 1 FROM dbo.UserClinics uc WHERE uc.UserId=e.CreatedByUserId AND uc.ClinicId=@IdClinica))
      OR (@Rol='Empleado' AND e.CreatedByUserId=@UserId AND EXISTS (SELECT 1 FROM dbo.UserClinics uc WHERE uc.UserId=e.CreatedByUserId AND uc.ClinicId=@IdClinica))
    )
  GROUP BY e.ExpenseDate
  ORDER BY e.ExpenseDate DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Expenses_Detail]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROC [dbo].[spRpt_Expenses_Detail]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,      -- 0 = todas (solo SuperAdmin)
  @DateFrom DATE = NULL,
  @DateTo   DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 52061, 'Rol invalido.', 1;

  IF @DateFrom IS NULL SET @DateFrom = DATEADD(DAY, -30, CONVERT(DATE, SYSDATETIME()));
  IF @DateTo   IS NULL SET @DateTo   = CONVERT(DATE, SYSDATETIME());

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 52062, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 52063, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT
    e.ExpenseDate                      AS [Fecha],
    e.Description                      AS [Descripcion],
    e.UserName                         AS [Usuario],
    (e.Amount * ISNULL(e.Quantity,1))  AS [TotalGasto],
    e.IdClinica                        AS [IdClinica],
    c.Nombre                           AS [NombreClinica],
    e.ExpenseId                        AS [ExpenseId]   -- útil para auditoría/edición
  FROM dbo.Expenses e
  LEFT JOIN dbo.Clinics c
    ON c.ClinicId = e.IdClinica
  WHERE e.ExpenseDate BETWEEN @DateFrom AND @DateTo
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR e.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND e.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND e.IdClinica=@IdClinica AND e.CreatedByUserId=@UserId)
    )
  ORDER BY e.ExpenseDate DESC, e.ExpenseId DESC;
END
GO
/****** Object:  StoredProcedure [dbo].[spRpt_Inventory_LowStock]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--

CREATE   PROC [dbo].[spRpt_Inventory_LowStock]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @Threshold INT = 3,
  @Take INT = 200
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51051, 'Rol invalido.', 1;

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51052, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51053, 'Empleado requiere IdClinica y UserId.', 1;

  IF @Threshold IS NULL OR @Threshold < 0 SET @Threshold = 0;

  SELECT TOP(@Take)
    i.ProductId,
    i.Codigo,
    i.NombreProducto,
    i.Existencia,
    i.Costo_Compra,
    i.Costo_Venta,
    i.IdClinica,
    c.Nombre AS NombreClinica
  FROM dbo.InventoryProducts i
  LEFT JOIN dbo.Clinics c ON c.ClinicId = i.IdClinica
  WHERE i.Existencia <= @Threshold
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR i.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND i.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND i.IdClinica=@IdClinica)
    )
  ORDER BY i.Existencia ASC, i.Codigo ASC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Inventory_Valuation]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--

CREATE   PROC [dbo].[spRpt_Inventory_Valuation]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51041, 'Rol invalido.', 1;

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51042, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51043, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT
    i.IdClinica,
    c.Nombre AS NombreClinica,
    COUNT(1) AS TotalProductos,
    SUM(i.Existencia) AS Unidades,
    SUM(ISNULL(i.Costo_Compra,0) * i.Existencia) AS ValorCosto,
    SUM(ISNULL(i.Costo_Venta,0)  * i.Existencia) AS ValorVentaPotencial
  FROM dbo.InventoryProducts i
  LEFT JOIN dbo.Clinics c ON c.ClinicId = i.IdClinica
  WHERE (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR i.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND i.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND i.IdClinica=@IdClinica) -- (inventario no tiene CreatedByUserId)
  )
  GROUP BY i.IdClinica, c.Nombre
  ORDER BY ValorCosto DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Orders_List]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROC [dbo].[spRpt_Orders_List]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,          -- 0 = todas (solo SuperAdmin/Admin)
  @DateFrom DATE = NULL,
  @DateTo   DATE = NULL,
  @Query NVARCHAR(200) = NULL  -- opcional: busca por No. Orden / Paciente / Tel
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

  -- Scope de clínicas para Admin (y opcionalmente SuperAdmin si decide filtrar por lista asignada)
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
        -- Filtro de búsqueda opcional
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
/****** Object:  StoredProcedure [dbo].[spRpt_Patients_AccountsReceivable]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--..

CREATE   PROC [dbo].[spRpt_Patients_AccountsReceivable]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @Take INT = 100
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51021, 'Rol invalido.', 1;

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51022, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51023, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT TOP(@Take)
    p.PatientId,
    p.OrderNo,
    p.ExamDate,
    p.Name,
    p.Phone,
    p.Total,
    p.Deposit,
    p.Balance,
    p.PaymentMethod,
    p.IdClinica,
    c.Nombre AS NombreClinica
  FROM dbo.Patients p
  LEFT JOIN dbo.Clinics c ON c.ClinicId = p.IdClinica
  WHERE ISNULL(p.Balance,0) > 0
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR p.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND p.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND p.IdClinica=@IdClinica AND p.CreatedByUserId=@UserId)
    )
  ORDER BY p.Balance DESC, p.OrderNo DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Patients_PendingDeliveries]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


--
CREATE   PROC [dbo].[spRpt_Patients_PendingDeliveries]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @Take INT = 50
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51011, 'Rol invalido.', 1;

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51012, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51013, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT TOP(@Take)
    p.PatientId,
    p.OrderNo,
    p.ExamDate,
    DATEDIFF(DAY, p.ExamDate, CONVERT(DATE, SYSDATETIME())) AS DiasDesdeExamen,
    p.Name,
    p.Phone,
    p.Optometrist,
    p.LabCode,
    p.Total,
    p.Deposit,
    p.Balance,
    p.IdClinica,
    c.Nombre AS NombreClinica
  FROM dbo.Patients p
  LEFT JOIN dbo.Clinics c ON c.ClinicId = p.IdClinica
  WHERE (p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='')
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR p.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND p.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND p.IdClinica=@IdClinica AND p.CreatedByUserId=@UserId)
    )
  ORDER BY p.OrderNo DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Patients_RevenueByDay]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROC [dbo].[spRpt_Patients_RevenueByDay]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @DateFrom DATE = NULL,
  @DateTo   DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51001, 'Rol invalido.', 1;

  IF @DateFrom IS NULL SET @DateFrom = DATEADD(DAY, -30, CONVERT(DATE, SYSDATETIME()));
  IF @DateTo   IS NULL SET @DateTo   = CONVERT(DATE, SYSDATETIME());

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51002, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51003, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT
    p.ExamDate,
    COUNT(1) AS TotalOrdenes,
    SUM(ISNULL(p.Total,0))   AS TotalFacturado,
    SUM(ISNULL(p.Deposit,0)) AS TotalAbonado,
    SUM(ISNULL(p.Balance,0)) AS TotalSaldoPendiente,
    SUM(CASE WHEN p.DeliveredBy IS NULL OR LTRIM(RTRIM(p.DeliveredBy))='' THEN 1 ELSE 0 END) AS PendientesEntrega
  FROM dbo.Patients p
  WHERE p.ExamDate BETWEEN @DateFrom AND @DateTo
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR p.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND p.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND p.IdClinica=@IdClinica AND p.CreatedByUserId=@UserId)
    )
  GROUP BY p.ExamDate
  ORDER BY p.ExamDate DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spRpt_Quotations_ByDay]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--

CREATE   PROC [dbo].[spRpt_Quotations_ByDay]
  @Rol NVARCHAR(20),
  @UserId INT = NULL,
  @IdClinica INT = 0,
  @DateFrom DATE = NULL,
  @DateTo   DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF @Rol NOT IN ('SuperAdmin','Administrador','Empleado')
    THROW 51031, 'Rol invalido.', 1;

  IF @DateFrom IS NULL SET @DateFrom = DATEADD(DAY, -30, CONVERT(DATE, SYSDATETIME()));
  IF @DateTo   IS NULL SET @DateTo   = CONVERT(DATE, SYSDATETIME());

  IF @Rol = 'Administrador' AND @IdClinica <= 0
    THROW 51032, 'Administrador requiere IdClinica.', 1;

  IF @Rol = 'Empleado' AND (@IdClinica <= 0 OR @UserId IS NULL)
    THROW 51033, 'Empleado requiere IdClinica y UserId.', 1;

  SELECT
    CONVERT(DATE, q.QuoteDate) AS QuoteDay,
    COUNT(1) AS TotalCotizaciones,
    SUM(ISNULL(q.Total,0)) AS TotalCotizado
  FROM dbo.Quotations q
  WHERE CONVERT(DATE, q.QuoteDate) BETWEEN @DateFrom AND @DateTo
    AND (
      (@Rol='SuperAdmin' AND (@IdClinica=0 OR q.IdClinica=@IdClinica))
      OR (@Rol='Administrador' AND q.IdClinica=@IdClinica)
      OR (@Rol='Empleado' AND q.IdClinica=@IdClinica AND q.CreatedByUserId=@UserId)
    )
  GROUP BY CONVERT(DATE, q.QuoteDate)
  ORDER BY QuoteDay DESC;
END

GO
/****** Object:  StoredProcedure [dbo].[spUsers_ChangePassword]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spUsers_ChangePassword]
    @UserId INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @UserId IS NULL OR @UserId <= 0
        THROW 50005, 'UserId invalido.', 1;

    IF @PasswordHash IS NULL OR LTRIM(RTRIM(@PasswordHash)) = ''
        THROW 50006, 'PasswordHash requerido.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = @UserId)
        THROW 50002, 'Usuario no existe.', 1;

    UPDATE dbo.Users
    SET
        PasswordHash = @PasswordHash,
        ChangePassword = 0
    WHERE UserId = @UserId;

    SELECT TOP (1)
        UserId,
        Username,
        FullName,
        Rol,
        IdClinica,
        IsActive,
        ChangePassword,
        CreatedAt
    FROM dbo.Users
    WHERE UserId = @UserId;
END
GO
/****** Object:  StoredProcedure [dbo].[spUsers_Create]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spUsers_Create]
    @Username      NVARCHAR(60),        -- codigo
    @PasswordHash  NVARCHAR(255),       -- lo genera el backend
    @FullName      NVARCHAR(120),       -- nombre
    @Rol           NVARCHAR(20),        -- SuperAdmin / Administrador / Empleado
    @IdClinicas    NVARCHAR(MAX) = NULL, -- ejemplo: '1,2,5'
    @IsActive      BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Validar rol
    IF @Rol NOT IN ('SuperAdmin', 'Administrador', 'Empleado')
    BEGIN
        THROW 50000, 'Rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado.', 1;
    END

    -- Validar username único
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Username = @Username)
    BEGIN
        THROW 50001, 'Ya existe un usuario con ese codigo/username.', 1;
    END

    DECLARE @Clinicas TABLE
    (
        ClinicId INT PRIMARY KEY
    );

    -- Parsear lista CSV de clínicas
    IF @IdClinicas IS NOT NULL AND LTRIM(RTRIM(@IdClinicas)) <> ''
    BEGIN
        INSERT INTO @Clinicas (ClinicId)
        SELECT DISTINCT TRY_CONVERT(INT, LTRIM(RTRIM(value)))
        FROM STRING_SPLIT(@IdClinicas, ',')
        WHERE TRY_CONVERT(INT, LTRIM(RTRIM(value))) IS NOT NULL;
    END

    -- Validar que todas las clínicas existan
    IF EXISTS (
        SELECT 1
        FROM @Clinicas c
        LEFT JOIN dbo.Clinics cl ON cl.ClinicId = c.ClinicId
        WHERE cl.ClinicId IS NULL
    )
    BEGIN
        THROW 50002, 'Una o mas clinicas enviadas no existen.', 1;
    END

    BEGIN TRAN;

        DECLARE @PrimaryClinicId INT = NULL;
        SELECT TOP 1 @PrimaryClinicId = ClinicId
        FROM @Clinicas
        ORDER BY ClinicId;

        -- Se deja IdClinica por compatibilidad usando la primera clínica
        INSERT INTO dbo.Users (Username, PasswordHash, FullName, Rol, IsActive, IdClinica)
        VALUES (@Username, @PasswordHash, @FullName, @Rol, @IsActive, @PrimaryClinicId);

        DECLARE @UserId INT = SCOPE_IDENTITY();

        -- Guardar asignaciones múltiples
        INSERT INTO dbo.UserClinics (UserId, ClinicId)
        SELECT @UserId, ClinicId
        FROM @Clinicas;

    COMMIT TRAN;

    -- Resultado principal
    SELECT TOP (1)
        UserId,
        Username,
        FullName,
        Rol,
        IdClinica,
        IsActive,
        CreatedAt
    FROM dbo.Users
    WHERE UserId = @UserId;

    -- Resultado secundario: clínicas asignadas
    SELECT
        uc.UserId,
        uc.ClinicId,
        c.Codigo,
        c.Nombre
    FROM dbo.UserClinics uc
    INNER JOIN dbo.Clinics c
        ON c.ClinicId = uc.ClinicId
    WHERE uc.UserId = @UserId
    ORDER BY uc.ClinicId;
END
GO
/****** Object:  StoredProcedure [dbo].[spUsers_Update]    Script Date: 05/04/2026 13:09:39 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[spUsers_Update]
    @UserId         INT,
    @Username       NVARCHAR(60) = NULL,
    @PasswordHash   NVARCHAR(255) = NULL,
    @FullName       NVARCHAR(120) = NULL,
    @Rol            NVARCHAR(20) = NULL,
    @IdClinicas     NVARCHAR(MAX) = NULL,
    @IsActive       BIT = NULL,
    @ChangePassword BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = @UserId)
    BEGIN
        THROW 50002, 'Usuario no existe.', 1;
    END

    IF @Rol IS NOT NULL
       AND @Rol NOT IN ('SuperAdmin', 'Administrador', 'Empleado')
    BEGIN
        THROW 50000, 'Rol invalido. Valores permitidos: SuperAdmin, Administrador, Empleado.', 1;
    END

    IF @Username IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM dbo.Users
           WHERE Username = @Username
             AND UserId <> @UserId
       )
    BEGIN
        THROW 50003, 'Ya existe otro usuario con ese codigo/username.', 1;
    END

    DECLARE @Clinicas TABLE
    (
        ClinicId INT PRIMARY KEY
    );

    IF @IdClinicas IS NOT NULL AND LTRIM(RTRIM(@IdClinicas)) <> ''
    BEGIN
        INSERT INTO @Clinicas (ClinicId)
        SELECT DISTINCT TRY_CONVERT(INT, LTRIM(RTRIM(value)))
        FROM STRING_SPLIT(@IdClinicas, ',')
        WHERE TRY_CONVERT(INT, LTRIM(RTRIM(value))) IS NOT NULL;

        IF EXISTS (
            SELECT 1
            FROM @Clinicas c
            LEFT JOIN dbo.Clinics cl ON cl.ClinicId = c.ClinicId
            WHERE cl.ClinicId IS NULL
        )
        BEGIN
            THROW 50004, 'Una o mas clinicas enviadas no existen.', 1;
        END
    END

    BEGIN TRAN;

        DECLARE @PrimaryClinicId INT = NULL;

        IF @IdClinicas IS NOT NULL
        BEGIN
            SELECT TOP 1 @PrimaryClinicId = ClinicId
            FROM @Clinicas
            ORDER BY ClinicId;
        END

        UPDATE dbo.Users
        SET
            Username       = COALESCE(@Username, Username),
            PasswordHash   = COALESCE(@PasswordHash, PasswordHash),
            FullName       = COALESCE(@FullName, FullName),
            Rol            = COALESCE(@Rol, Rol),
            IdClinica      = CASE
                                WHEN @IdClinicas IS NOT NULL THEN @PrimaryClinicId
                                ELSE IdClinica
                             END,
            IsActive       = COALESCE(@IsActive, IsActive),
            ChangePassword = COALESCE(@ChangePassword, ChangePassword)
        WHERE UserId = @UserId;

        IF @IdClinicas IS NOT NULL
        BEGIN
            DELETE FROM dbo.UserClinics
            WHERE UserId = @UserId;

            INSERT INTO dbo.UserClinics (UserId, ClinicId)
            SELECT @UserId, ClinicId
            FROM @Clinicas;
        END

    COMMIT TRAN;

    SELECT TOP (1)
        UserId,
        Username,
        FullName,
        Rol,
        IdClinica,
        IsActive,
        ChangePassword,
        CreatedAt
    FROM dbo.Users
    WHERE UserId = @UserId;

    SELECT
        uc.UserId,
        uc.ClinicId,
        c.Codigo,
        c.Nombre
    FROM dbo.UserClinics uc
    INNER JOIN dbo.Clinics c
        ON c.ClinicId = uc.ClinicId
    WHERE uc.UserId = @UserId
    ORDER BY uc.ClinicId;
END

GO

