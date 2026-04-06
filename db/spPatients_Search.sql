ALTER PROC [dbo].[spPatients_Search]
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
