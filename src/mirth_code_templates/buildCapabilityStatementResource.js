/**
	Builds CapabilityStatement FHIR Resource that adheres to its STU3 specification,
	see https://www.hl7.org/fhir/STU3/capabilitystatement.html for more info.
 
	@author Frazer Smith
	@param {object} data - Java RowSet object.
	@returns {object} CapabilityStatement FHIR resource.
 */
function buildCapabilityStatementResource(data) {
	const result = getResultSet(data);
	const resource = JSON.parse(result.resource);
	resource.id = newStringOrUndefined(result.id);

	return resource;
}
