module.exports = {

  friendlyName: 'Renders a ClinicalInfoRequest XML message.',
  description: 'Return a rendered ClinicalInfoRequest XML message',
  inputs: {
    clinicID: {
      type: 'string',
      required: true
    },
    fromQualifiedAddr: {
      type: 'string',
      required: true
    },
    responseMessageID: {
      type: 'string',
      required: true
    },
    negotiatedMessageID: {
      type: 'string',
      required: true
    },
    patientXML: {
      type: 'string'
    },
    prescriberXML: {
      type: 'string'
    }
  },


  fn: async function (inputs, exits) {
    return exits.success(
      `<Message xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="transport.xsd" DatatypesVersion="DatatypesVersion0" TransportVersion="TransportVersion0" TransactionDomain="SCRIPT"
    TransactionVersion="TransactionVersion0" StructuresVersion="StructuresVersion0" ECLVersion="ECLVersion0">
    <Header>
      <To>EMP-CLINIC:`+inputs.clinicID+`</To>
      <From>`+inputs.fromQualifiedAddr+`</From>
      <MessageID>`+inputs.responseMessageID+`</MessageID>
      <RelatesToMessageID>`+inputs.negotiatedMessageID+`</RelatesToMessageID>
      <SentTime>`+(new Date()).toISOString()+`</SentTime>
      <SenderSoftware>
        <SenderSoftwareDeveloper>Empower Pharmacy</SenderSoftwareDeveloper>
        <SenderSoftwareProduct>Empower Pharmacy Clinic API</SenderSoftwareProduct>
        <SenderSoftwareVersionRelease>1.0</SenderSoftwareVersionRelease>
      </SenderSoftware>
    </Header>
    <Body>
      <ClinicalInfoRequest>
      `+inputs.patientXML+`
      <Pharmacy>
      <Identification>
          <NCPDPID>5906017</NCPDPID>
          <NPI>1730449299</NPI>
      </Identification>
      <BusinessName>Empower Pharmacy</BusinessName>
      <Address>
          <AddressLine1>5980 W Sam Houston PKWY N.</AddressLine1>
          <AddressLine2>Ste. 300</AddressLine2>
          <City>Houston</City>
          <StateProvince>TX</StateProvince>
          <PostalCode>77041</PostalCode>
          <CountryCode>US</CountryCode>
      </Address>
      <CommunicationNumbers>
          <PrimaryTelephone>
              <Number>8326784417</Number>
          </PrimaryTelephone>
      </CommunicationNumbers>
  </Pharmacy>
  `+inputs.prescriberXML+`
  <Consent>N</Consent>
  <ClinicalInfoTypesRequested>All</ClinicalInfoTypesRequested>
  <ClinicalInfoTypesRequested>All</ClinicalInfoTypesRequested>
  <ClinicalInfoFormatsSupported>
  </ClinicalInfoFormatsSupported>
  </ClinicalInfoRequest>
      </Body>
  </Message>`
    );
  }

};
