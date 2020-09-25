/* eslint-disable quotes */

/**
	Queries database for data needed to build FHIR resource.
 
	@author Frazer Smith
	@param {string} type - Resource name.
	@param {object} params - An array of predicates to be added to SQL queries.
	@returns {object} Java ResultSet object.
 */
function buildResourceQuery(type, params) {
	let firstParams = '';
	let secondParams = '';
	let thirdParams = '';
	let fourthParams = '';

	if (params[0]) {
		firstParams = `AND ${params[0]}`;
	}
	if (params[1]) {
		secondParams = `AND ${params[1]}`;
	}
	if (params[2]) {
		thirdParams = `AND ${params[2]}`;
	}
	// Used exclusively by Encounter resource query for now
	if (params[3]) {
		fourthParams = `WHERE ${params[3]}`;
	}

	// type is Java object so has to be coerced to a JS object by adding an empty string
	switch (`${type}`) {
		case 'allergyintolerance':
			return executeCachedQuery(
				`SELECT DISTINCT id, patientReference, allergyGroupDesc, allergyCodingDesc, allergyDrugDesc, allergyDrugGenericDesc, allergyDrugCategoryDesc, allergyDrugFormDesc, allergyDrugIngredientDesc, allergyComment, clinicalStatusCode, verificationStatusCode, typeCode, criticalityCode, CONCAT(COALESCE(assertedDate, ''), 'T', COALESCE(assertedTime, '')) AS assertedDate, CONCAT(COALESCE(lastUpdateDate, ''), 'T', COALESCE(lastUpdateTime, '')) AS lastUpdated FROM OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT DISTINCT REPLACE(alle.ALG_RowId, ''||'', ''-'') AS id, alle.ALG_PAPMI_ParRef->PAPMI_No AS patientReference, alle.ALG_AllergyGrp_DR->ALGR_Desc AS allergyGroupDesc, alle.ALG_TYPE_DR->ALG_Desc AS allergyCodingDesc, alle.ALG_PHCDM_DR->PHCD_ProductName AS allergyDrugDesc, alle.ALG_PHCGE_DR->PHCGE_Name AS allergyDrugGenericDesc, alle.ALG_PHCSC_DR->PHCSC_Desc AS allergyDrugCategoryDesc, alle.ALG_PHCDRGForm_DR->PHCDF_Description AS allergyDrugFormDesc, alle.ALG_Ingred_DR->INGR_Desc AS allergyDrugIngredientDesc, alle.ALG_Comments AS allergyComment, CASE alle.ALG_Status WHEN ''A'' THEN ''active'' WHEN ''I'' THEN ''inactive'' WHEN ''R'' THEN ''resolved'' ELSE NULL END AS clinicalStatusCode, CASE WHEN alle.ALG_Status = ''C'' THEN ''unconfirmed'' WHEN alle.ALG_ConfirmedDate IS NOT NULL OR (alle.ALG_Status != ''C'' AND alle.ALG_Status IS NOT NULL) THEN ''confirmed'' ELSE ''unconfirmed'' END as verificationStatusCode, CASE alle.ALG_Category_DR->ALRGCAT_DESC WHEN ''ALLERGY'' THEN ''allergy'' WHEN ''SIDEEFFECT'' THEN ''intolerance'' ELSE NULL END AS typeCode, CASE alle.ALG_Severity_DR WHEN 1 THEN ''high'' WHEN 2 THEN ''low'' WHEN 5 THEN ''high'' WHEN 4 THEN ''unable-to-assess'' ELSE NULL END AS criticalityCode, alle.ALG_Date AS assertedDate, alle.ALG_Time AS assertedTime, alle.ALG_LastUpdateDate AS lastUpdateDate, alle.ALG_LastUpdateTime as lastUpdateTime FROM %ALLINDEX PA_Allergy alle WHERE (alle.ALG_PAPMI_ParRef->PAPMI_No IS NOT NULL) ${firstParams}');`
			);
		case 'condition':
			return executeCachedQuery();
		case 'documentreference':
			return executeCachedQuery();
		case 'encounter':
			return executeCachedQuery(
				`WITH encounter_CTE(encounterIdentifier, encounterClassDesc, encounterClassCode, encounterTypeDesc, encounterTypeCode, encounterPeriodStartDate, encounterPeriodStartTime, encounterPeriodEndDate, encounterPeriodEndTime, encounterParticipantIndividualCode_opattending, encounterParticipantIndividualDisplay_opattending, encounterHospitalizationAdmitsourceCodingCode, encounterHospitalizationAdmitsourceCodingDesc, encounterHospitalizationDischargedispositionCodingCode, encounterHospitalizationDischargedispositionCodingDesc, encounterAdmissionmethodCodingCode, encounterAdmissionmethodCodingDesc, encounterDischargemethodCodingCode, encounterDischargemethodCodingDesc, subjectReference, encounterStatus, lastUpdateDate, lastUpdateTime, encounterStatusMapped) AS (SELECT DISTINCT *, CASE WHEN encounterStatus IN ('C', 'N', 'X', 'T', 'J', 'H') THEN 'cancelled' WHEN encounterStatus IN ('D', 'R') OR (encounterStatus IN ('A') AND encounterPeriodStartDate IS NOT NULL AND encounterPeriodEndDate IS NOT NULL) THEN 'finished' WHEN (encounterPeriodStartDate > CURRENT_TIMESTAMP AND encounterPeriodStartDate IS NOT NULL) OR encounterStatus IN ('P') THEN 'planned' WHEN encounterStatus IN ('A', 'S', 'W') THEN 'arrived' WHEN encounterPeriodStartDate IS NOT NULL AND encounterPeriodEndDate IS NULL THEN 'in-progress' ELSE 'unknown' END AS encounterStatusMapped FROM OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT REPLACE(app.APPT_RowId, ''||'', ''-'') AS encounterIdentifier, ''ambulatory'' AS encounterClassDesc, ''AMB'' AS encounterClassCode, app.APPT_AS_ParRef->AS_RES_ParRef->RES_CTLOC_DR->CTLOC_Desc AS encounterTypeDesc, app.APPT_AS_ParRef->AS_RES_ParRef->RES_CTLOC_DR->CTLOC_Code AS encounterTypeCode, COALESCE(app.APPT_ArrivalDate, app.APPT_DateComp) AS encounterPeriodStartDate, COALESCE(app.APPT_ArrivalTime, app.APPT_TimeComp) AS encounterPeriodStartTime, NULL AS encounterPeriodEndDate, NULL AS encounterPeriodEndTime, app.APPT_SeenDoctor_DR->CTPCP_Code AS encounterParticipantIndividualCode_opattending, app.APPT_SeenDoctor_DR->CTPCP_Desc AS encounterParticipantIndividualDisplay_opattending, NULL AS encounterHospitalizationAdmitsourceCodingCode, NULL AS encounterHospitalizationAdmitsourceCodingDesc, NULL AS encounterHospitalizationDischargedispositionCodingCode, NULL AS encounterHospitalizationDischargedispositionCodingDesc, NULL AS encounterAdmissionmethodCodingCode, NULL AS encounterAdmissionmethodCodingDesc, NULL AS encounterDischargemethodCodingCode, NULL AS encounterDischargemethodCodingDesc, app.APPT_Adm_DR->PAADM_PAPMI_DR->PAPMI_No AS subjectReference, app.APPT_Status AS encounterStatus, app.APPT_LastUpdateDate AS lastUpdateDate, NULL AS lastUpdateTime FROM RB_Appointment app WHERE app.APPT_Adm_DR->PAADM_PAPMI_DR->PAPMI_No IS NOT NULL ${firstParams}') UNION SELECT DISTINCT *, CASE WHEN encounterStatus IN ('C', 'N', 'X', 'T', 'J', 'H') THEN 'cancelled' WHEN encounterStatus IN ('D', 'R') OR (encounterStatus IN ('A') AND encounterPeriodStartDate IS NOT NULL AND encounterPeriodEndDate IS NOT NULL) THEN 'finished' WHEN (encounterPeriodStartDate > CURRENT_TIMESTAMP AND encounterPeriodStartDate IS NOT NULL) OR encounterStatus IN ('P') THEN 'planned' WHEN encounterStatus IN ('A', 'S', 'W') THEN 'arrived' WHEN encounterPeriodStartDate IS NOT NULL AND encounterPeriodEndDate IS NULL THEN 'in-progress' ELSE 'unknown' END AS encounterStatusMapped FROM OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT REPLACE(PAADM_ADMNo, ''/'', ''-'') AS encounterIdentifier, CASE PAADM_Type WHEN ''I'' THEN ''inpatient'' WHEN ''E'' THEN ''emergency'' END as encounterClassDesc, CASE PAADM_Type WHEN ''I'' THEN ''IMP'' WHEN ''E'' THEN ''EMER'' END as encounterClassCode, PAADM_DepCode_DR->CTLOC_Desc AS encounterTypeDesc, PAADM_DepCode_DR->CTLOC_Code AS encounterTypeCode, PAADM_AdmDate AS encounterPeriodStartDate, PAADM_AdmTime AS encounterPeriodStartTime, PAADM_DischgDate AS encounterPeriodEndDate, PAADM_DischgTime AS encounterPeriodEndTime, NULL AS encounterParticipantIndividualCode_opattending, NULL AS encounterParticipantIndividualDisplay_opattending, PAADM_AdmSrc_DR->ADSOU_Code AS encounterHospitalizationAdmitsourceCodingCode, PAADM_AdmSrc_DR->ADSOU_Desc AS encounterHospitalizationAdmitsourceCodingDesc, CASE PAADM_Type WHEN ''I'' THEN PAADM_MainMRADM_DR->MRADM_DischDestin_DR->DDEST_Code ELSE NULL END AS encounterHospitalizationDischargedispositionCodingCode, CASE PAADM_Type WHEN ''I'' THEN PAADM_MainMRADM_DR->MRADM_DischDestin_DR->DDEST_Desc ELSE NULL END AS encounterHospitalizationDischargedispositionCodingDesc, PAADM_AdmMethod_DR->ADMETH_Code AS encounterAdmissionmethodCodingCode, PAADM_AdmMethod_DR->ADMETH_Desc AS encounterAdmissionmethodCodingDesc, CASE PAADM_Type WHEN ''I'' THEN PAADM_MainMRADM_DR->MRADM_ConditAtDisch_DR->DISCON_Code ELSE NULL END AS encounterDischargemethodCodingCode, CASE PAADM_Type WHEN ''I'' THEN PAADM_MainMRADM_DR->MRADM_ConditAtDisch_DR->DISCON_Desc ELSE NULL END AS encounterDischargemethodCodingDesc, PAADM_PAPMI_DR->PAPMI_No AS subjectReference, PAADM_VisitStatus AS encounterStatus, PAADM_UpdateDate AS lastUpdateDate, PAADM_UpdateTime AS lastUpdateTime FROM PA_Adm WHERE PAADM_Type IN (''I'', ''E'') AND PAADM_PAPMI_DR->PAPMI_No IS NOT NULL ${secondParams}')) SELECT encounterIdentifier, encounterStatusMapped, encounterStatus, encounterClassDesc, encounterClassCode, CASE WHEN ISNUMERIC(encounterTypeCode) <> 1 THEN NULL ELSE UPPER(encounterTypeDesc) END AS encounterTypeDesc, CASE WHEN ISNUMERIC(encounterTypeCode) <> 1 THEN NULL ELSE encounterTypeCode END AS encounterTypeCode, CONCAT(COALESCE(encounterPeriodStartDate, ''), 'T', COALESCE(encounterPeriodStartTime, '')) AS encounterPeriodStart, CONCAT(COALESCE(encounterPeriodEndDate, ''), 'T', COALESCE(encounterPeriodEndTime, '')) AS encounterPeriodEnd, encounterParticipantIndividualCode_opattending, encounterParticipantIndividualDisplay_opattending, wards.admissionWardCode AS encounterLocation1Identifier, UPPER(wards.admissionWardDesc) AS encounterLocation1Display, wards.dischargeWardCode AS encounterLocation2Identifier, UPPER(wards.dischargeWardDesc) AS encounterLocation2Display, consultants.admissionConsultantCode AS encounterParticipantIndividualCode_admitting, consultants.admissionConsultantDesc AS encounterParticipantIndividualDisplay_admitting, consultants.admissionConsultantSpecCode AS encounterTypeCodeAdm, consultants.admissionConsultantSpecDesc AS encounterTypeDescAdm, consultants.dischargeConsultantCode AS encounterParticipantIndividualCode_discharging, consultants.dischargeConsultantDesc AS encounterParticipantIndividualDisplay_discharging, consultants.dischargeConsultantSpecCode AS encounterTypeCodeDis, consultants.dischargeConsultantSpecDesc AS encounterTypeDescDis, encounterHospitalizationAdmitsourceCodingCode, encounterHospitalizationAdmitsourceCodingDesc, encounterHospitalizationDischargedispositionCodingCode, encounterHospitalizationDischargedispositionCodingDesc, encounterAdmissionmethodCodingCode, encounterAdmissionmethodCodingDesc, encounterDischargemethodCodingCode, encounterDischargemethodCodingDesc, subjectReference, CONCAT(COALESCE(lastUpdateDate, ''), 'T', COALESCE(lastUpdateTime, '')) AS lastUpdated FROM encounter_CTE LEFT JOIN (SELECT * FROM (SELECT REPLACE(PAADM_ADMNo, '/', '-') AS PAADM_ADMNo, dischargeConsultantCode, dischargeConsultantDesc, dischargeConsultantSpecCode, dischargeConsultantSpecDesc, admissionConsultantCode, admissionConsultantDesc, admissionConsultantSpecCode, admissionConsultantSpecDesc, row_number() over (partition by PAADM_ADMNo order by TRANS_ChildSub)	AS transOrder FROM OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT TRANS_ParRef->PAADM_AdmDocCodeDR->CTPCP_Code AS dischargeConsultantCode, TRANS_ParRef->PAADM_AdmDocCodeDR->CTPCP_Desc AS dischargeConsultantDesc, TRANS_ParRef->PAADM_AdmDocCodeDR->CTPCP_Spec_DR->CTSPC_Code dischargeConsultantSpecCode, TRANS_ParRef->PAADM_AdmDocCodeDR->CTPCP_Spec_DR->CTSPC_Desc dischargeConsultantSpecDesc, TRANS_CTCP_DR->CTPCP_Code AS admissionConsultantCode, TRANS_CTCP_DR->CTPCP_Desc AS admissionConsultantDesc, TRANS_CTCP_DR->CTPCP_Spec_DR->CTSPC_Code admissionConsultantSpecCode, TRANS_CTCP_DR->CTPCP_Spec_DR->CTSPC_Desc admissionConsultantSpecDesc, TRANS_ChildSub, TRANS_ParRef->PAADM_ADMNo FROM PA_AdmTransaction WHERE TRANS_ParRef->PAADM_Type = ''I'' AND TRANS_ParRef->PAADM_Epissubtype_DR->SUBT_Code = ''1'' AND TRANS_CTCP_DR IS NOT NULL ${thirdParams}')) a WHERE transOrder = 1) consultants ON encounter_CTE.encounterIdentifier = consultants.PAADM_ADMNo LEFT JOIN (SELECT * FROM (SELECT REPLACE(PAADM_ADMNo, '/', '-') AS PAADM_ADMNo, dischargeWardCode, dischargeWardDesc, admissionWardCode, admissionWardDesc, row_number() over (partition by PAADM_ADMNo order by TRANS_ChildSub)	AS transOrder FROM OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT TRANS_ParRef->PAADM_CurrentWard_DR->WARD_Code AS dischargeWardCode, TRANS_ParRef->PAADM_CurrentWard_DR->WARD_Desc AS dischargeWardDesc, TRANS_Ward_DR->WARD_Code AS admissionWardCode, TRANS_Ward_DR->WARD_Desc AS admissionWardDesc, TRANS_ChildSub, TRANS_ParRef->PAADM_ADMNo FROM PA_AdmTransaction WHERE TRANS_ParRef->PAADM_Type = ''I'' AND TRANS_ParRef->PAADM_Epissubtype_DR->SUBT_Code = ''1'' AND TRANS_Ward_DR IS NOT NULL ${thirdParams}')) a WHERE transOrder = 1) wards ON encounter_CTE.encounterIdentifier = wards.PAADM_ADMNo ${fourthParams};`
			);
		case 'flag':
			return executeCachedQuery(
				`WITH flag_CTE AS (SELECT DISTINCT flagId, CASE ALM_Status WHEN 'I' THEN 'inactive' WHEN 'A' THEN 'active' END AS flagStatusCode, flagCategoryCodingDisplay, flagCategoryCodingCode, flagCodeCodingDisplay, flagCodeCodingCode, flagCodeText, flagSubjectReference, CONCAT(COALESCE(periodStartDate, ''),'T', COALESCE(periodStartTime, '')) AS periodStart, CONCAT(COALESCE(periodEndDate, ''),'T00:00:00') AS periodEnd FROM OPENQUERY( [ENYH-PRD-ANALYTICS], 'SELECT DISTINCT TOP 100 ALM_Status, COALESCE(ALM_OnsetDate, ALM_CreateDate) AS periodStartDate, COALESCE(ALM_OnsetTime, ALM_CreateTime) AS periodStartTime, COALESCE(ALM_ExpiryDate, ALM_ClosedDate) AS periodEndDate, ALM_ClosedTime AS periodEndTime,     REPLACE(alert.ALM_RowID, ''||'', ''-'') AS flagId, alert.ALM_Alert_DR->ALERT_Desc AS flagCodeCodingDisplay, alert.ALM_Alert_DR->ALERT_Code AS flagCodeCodingCode, alert.ALM_Message AS flagCodeText, alert.ALM_AlertCategory_DR->ALERTCAT_Desc AS flagCategoryCodingDisplay, alert.ALM_AlertCategory_DR->ALERTCAT_Code AS flagCategoryCodingCode, alert.ALM_PAPMI_ParRef->PAPMI_No AS flagSubjectReference FROM PA_AlertMsg alert WHERE alert.ALM_Alert_DR IS NOT NULL ${firstParams}')) SELECT flag_CTE.*, snom.SNOMED_Code AS flagCodeCodingSnomedCode, snom.SNOMED_Display AS flagCodeCodingSnomedDisplay FROM flag_CTE LEFT JOIN lookup.dbo.ydh_alert_list snom ON flag_CTE.flagCodeCodingCode = snom.YDH_TrakCare_Code WHERE flagStatusCode IS NOT NULL ${secondParams};`
			);
		case 'medicationstatement':
			return executeCachedQuery(
				`WITH medicationStatement_CTE AS (SELECT DISTINCT medstatId, CONCAT(COALESCE(medstatDateassertedDate, ''),'T', COALESCE(medstatDateassertedTime, '')) AS medstatDateasserted, CONCAT(COALESCE(medstatEffectiveStart_Datepart, ''),'T', COALESCE(medstatEffectiveStart_Timepart, '')) AS medstatEffectiveStart, CONCAT(COALESCE(medstatEffectiveEnd_Datepart, ''),'T', COALESCE(medstatEffectiveEnd_Timepart, '')) AS medstatEffectiveEnd, medstatSubjectReference, medstatDosageTimingRepeatDuration, CASE medstatDosageTimingRepeatDurationUnit WHEN 'DO' THEN NULL WHEN 'M' THEN 'min' WHEN 'H' THEN 'h' WHEN 'D' THEN 'd' WHEN 'W' THEN 'wk' END AS medstatDosageTimingRepeatDurationUnit, medstatDosagePatientinstruction, medstatDosageRouteText, medstatDosageDoseQuantityValue, medstatDosageDoseQuantityUnit, CASE WHEN (CURRENT_TIMESTAMP BETWEEN CAST(medstatEffectiveStart_Datepart AS DATETIME) + CAST(medstatEffectiveStart_Timepart AS DATETIME) AND CAST(medstatEffectiveEnd_Datepart AS DATETIME) + CAST(medstatEffectiveEnd_Timepart AS DATETIME)) AND orderItemStatus != 'Discontinued' THEN 'active' WHEN CURRENT_TIMESTAMP < CAST(medstatEffectiveStart_Datepart AS DATETIME) + CAST(medstatEffectiveStart_Timepart AS DATETIME) AND orderItemStatus != 'Discontinued' THEN 'intended' WHEN CURRENT_TIMESTAMP > CAST(medstatEffectiveEnd_Datepart AS DATETIME) + CAST(medstatEffectiveEnd_Timepart AS DATETIME) AND orderItemStatus != 'Discontinued' THEN 'completed' WHEN orderItemStatus = 'Discontinued' AND orderItemVariance IN ('DATA', 'ERROR') THEN 'entered-in-error' WHEN orderItemStatus = 'Discontinued' THEN 'stopped' END AS medstatStatusCode, medicationId, medicationCodeText, medicationCodeCodingDisplay, medicationCodeCodingCode FROM OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT DISTINCT REPLACE(oi.OEORI_RowID, ''||'', ''-'') AS medstatId, oi.OEORI_Date AS medstatDateassertedDate, oi.OEORI_TimeOrd AS medstatDateassertedTime, oi.OEORI_SttDat AS medstatEffectiveStart_Datepart, oi.OEORI_SttTim AS medstatEffectiveStart_Timepart, oi.OEORI_EndDate AS medstatEffectiveEnd_Datepart, oi.OEORI_EndTime AS medstatEffectiveEnd_Timepart, oi.OEORI_OEORD_ParRef->OEORD_Adm_DR->PAADM_PAPMI_DR->PAPMI_No AS medstatSubjectReference, oi.OEORI_OEOrdItem2_DR->ITM2_DurationValue AS medstatDosageTimingRepeatDuration, oi.OEORI_OEOrdItem2_DR->ITM2_DurationUnit AS medstatDosageTimingRepeatDurationUnit, oi.OEORI_Instr_DR->PHCIN_Desc1 AS medstatDosagePatientinstruction, oi.OEORI_AdminRoute_DR->ADMR_Desc AS medstatDosageRouteText, oi.OEORI_DoseQty AS medstatDosageDoseQuantityValue, oi.OEORI_Unit_DR->CTUOM_Desc AS medstatDosageDoseQuantityUnit, oi.OEORI_ItemStat_DR->OSTAT_Desc AS orderItemStatus, oi.OEORI_VarianceReason_DR->VR_Code AS orderItemVariance, NULL AS RESOURCE_LINEBREAK, oi.OEORI_ItmMast_DR->ARCIM_Abbrev AS medicationCodeText, REPLACE(oi.OEORI_ItmMast_DR->ARCIM_RowID, ''||'', ''-'') AS medicationId, arcex.EXT_Desc AS medicationCodeCodingDisplay, arcex.EXT_Code AS medicationCodeCodingCode FROM OE_OrdItem oi LEFT JOIN ARC_ItmMast arc ON oi.OEORI_ItmMast_DR = arc.ARCIM_RowId LEFT JOIN ARC_ItemExternalCodes arcex ON arc.ARCIM_RowId = arcex.EXT_ParRef AND EXT_HL7SendingFacility = ''FDB'' AND EXT_HL7SendingApp IN (''AMPP'', ''VMPP'') WHERE oi.OEORI_Categ_DR->ORCAT_Desc IN (''PHARMACY'', ''PHARM'') ${firstParams}')) SELECT * FROM medicationStatement_CTE WHERE medstatStatusCode IS NOT NULL ${secondParams};`
			);
		case 'patient':
			return executeCachedQuery(
				`SELECT nhsNumber, nhsNumberTraceStatusDesc, nhsNumberTraceStatusCode, patient.patientNo, active, ethnicCategoryCode, ethnicCategoryDesc, ethnic.CareConnect_Code AS ethnicCategoryCareConnectCode, ethnic.CareConnect_Display AS ethnicCategoryCareConnectDesc, homePhone, businessPhone, mobilePhone, appointmentSMS, email, preferredContactMethod, preferredLanguage, interpreterRequired, nameFamily, nameGiven1First, nameGiven2Middle, namePrefix, maritalStatusDesc, maritalStatusCode, addressLine1, addressLine2, city, district, postalCode, LOWER(gender) AS gender, birthdate, deceased, gpDesc, gpAddressLine1, gpAddressLine2, gpCity, gpPostalCode, gpIdentifier, contactName, contactPhone, contactText, dnd.DND, school.schoolName, school.schoolId, school.schoolPhone, CONCAT(COALESCE(lastUpdateDate, ''), 'T', COALESCE(lastUpdateTime, '')) AS lastUpdated FROM OPENQUERY( [ENYH-PRD-ANALYTICS], 'SELECT patmas.PAPMI_PAPER_DR->PAPER_ID AS nhsNumber, patmas.PAPMI_TraceStatus_DR->TRACE_Desc AS nhsNumberTraceStatusDesc, patmas.PAPMI_TraceStatus_DR AS nhsNumberTraceStatusCode, patmas.PAPMI_No AS patientNo, patmas.PAPMI_Active, CASE WHEN patmas.PAPMI_Active IS NULL THEN ''true'' WHEN patmas.PAPMI_Active = ''Y'' THEN ''true'' ELSE NULL END AS active, patmas.PAPMI_PAPER_DR->PAPER_IndigStat_DR->INDST_Desc AS ethnicCategoryDesc, patmas.PAPMI_PAPER_DR->PAPER_IndigStat_DR->INDST_Code AS ethnicCategoryCode, patmas.PAPMI_PAPER_DR->PAPER_TelH AS "homePhone", patmas.PAPMI_PAPER_DR->PAPER_TelO AS "businessPhone", patmas.PAPMI_PAPER_DR->PAPER_MobPhone AS "mobilePhone", patmas.PAPMI_PAPER_DR->PAPER_AppointmentSMS AS "appointmentSMS", patmas.PAPMI_PAPER_DR->PAPER_Email AS "Email", patmas.PAPMI_PAPER_DR->PAPER_PreferredContactMethod AS "PreferredContactMethod", patmas.PAPMI_PAPER_DR->PAPER_PrefLanguage_DR->PREFL_Desc AS "PreferredLanguage", patmas.PAPMI_PAPER_DR->PAPER_InterpreterRequired AS "InterpreterRequired", patmas.PAPMI_PAPER_DR->PAPER_UpdateDate AS lastUpdateDate, patmas.PAPMI_PAPER_DR->PAPER_UpdateTime AS lastUpdateTime, patmas.PAPMI_PAPER_DR->PAPER_Name AS nameFamily, patmas.PAPMI_PAPER_DR->PAPER_Name2 AS nameGiven1First, patmas.PAPMI_PAPER_DR->PAPER_Name3 AS nameGiven2Middle, patmas.PAPMI_PAPER_DR->PAPER_Title_DR->TTL_Desc AS nameprefix, patmas.PAPMI_PAPER_DR->PAPER_NokName AS contactName, patmas.PAPMI_PAPER_DR->PAPER_NokPhone AS contactPhone, patmas.PAPMI_PAPER_DR->PAPER_NokText AS contactText, CASE patmas.PAPMI_PAPER_DR->PAPER_Marital_DR->CTMAR_RowId WHEN 1 THEN ''Married'' WHEN 2 THEN ''unknown'' WHEN 3 THEN ''Widowed'' WHEN 4 THEN ''unmarried'' WHEN 5 THEN ''Legally Seperated'' WHEN 6 THEN ''Divorced'' END AS maritalStatusDesc, CASE patmas.PAPMI_PAPER_DR->PAPER_Marital_DR->CTMAR_Code WHEN ''N'' THEN ''U'' ELSE patmas.PAPMI_PAPER_DR->PAPER_Marital_DR->CTMAR_Code END AS maritalStatusCode, patmas.PAPMI_PAPER_DR->PAPER_StName AS "addressLine1", patmas.PAPMI_PAPER_DR->PAPER_ForeignAddress AS "addressLine2", patmas.PAPMI_PAPER_DR->PAPER_CityCode_DR->CTCIT_Desc AS "city", patmas.PAPMI_PAPER_DR->PAPER_CT_Province_DR->PROV_Desc AS "district", patmas.PAPMI_PAPER_DR->PAPER_Zip_DR->CTZIP_Code AS "postalCode", CASE patmas.PAPMI_PAPER_DR->PAPER_Sex_DR->CTSEX_RowId WHEN 1 THEN ''female'' WHEN 2 THEN ''unknown'' WHEN 3 THEN ''other'' WHEN 4 THEN ''male'' END AS gender, patmas.PAPMI_DOB AS birthDate, CASE WHEN patmas.PAPMI_PAPER_DR->PAPER_Deceased = ''Y'' THEN ''true'' WHEN patmas.PAPMI_PAPER_DR->PAPER_Deceased = ''N'' THEN NULL END AS deceased, patmas.PAPMI_PAPER_DR->PAPER_FamilyDoctor_DR->REFD_Desc AS "gpDesc", patmas.PAPMI_PAPER_DR->PAPER_FamilyDoctorClinic_DR->CLN_Address1 AS "gpAddressLine1", patmas.PAPMI_PAPER_DR->PAPER_FamilyDoctorClinic_DR->CLN_Address2 AS "gpAddressLine2", patmas.PAPMI_PAPER_DR->PAPER_FamilyDoctorClinic_DR->CLN_City_DR->CTCIT_Desc AS "gpCity", patmas.PAPMI_PAPER_DR->PAPER_FamilyDoctorClinic_DR->CLN_Zip_DR->CTZIP_Code AS "gpPostalCode", patmas.PAPMI_PAPER_DR->PAPER_FamilyDoctorClinic_DR->CLN_Code AS "gpIdentifier" FROM %ALLINDEX PA_PatMas patmas WHERE COALESCE(PAPMI_Active,''Y'') = ''Y'' AND (patmas.PAPMI_PAPER_DR->PAPER_ID IS NOT NULL OR patmas.PAPMI_No IS NOT NULL) ${firstParams}') AS patient LEFT JOIN lookup.dbo.ydh_dnd AS dnd WITH (NOLOCK) ON patient.patientNo = dnd.patientNo LEFT JOIN OPENQUERY([ENYH-PRD-ANALYTICS], 'SELECT DISTINCT NOK_NonGovOrg_DR->NGO_Code AS schoolId, NOK_NonGovOrg_DR->NGO_Desc AS schoolName, NOK_NonGovOrg_DR->NGO_Phone AS schoolPhone, NOK_PAPMI_ParRef->PAPMI_No AS patientNo FROM PA_NOK WHERE NOK_Relation_DR->CTRLT_Code = ''SCH'' AND NOK_Inactive = ''N'' ${secondParams}') AS school ON patient.patientNo = school.patientNo LEFT JOIN lookup.dbo.ydh_ethnicity_list ethnic WITH (NOLOCK) ON patient.ethnicCategoryCode = ethnic.YDH_TrakCare_Code;`
			);
		default:
			break;
	}
}
