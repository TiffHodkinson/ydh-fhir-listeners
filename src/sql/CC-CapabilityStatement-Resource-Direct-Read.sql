SELECT id,
    [resource]
FROM lookup.dbo.fhir_capabilitystatement
WHERE [resource] IS NOT NULL
    AND id = 1;