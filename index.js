const { AnalyzeDocumentCommand, TextractClient } = require('@aws-sdk/client-textract')
const { fromIni } = require("@aws-sdk/credential-providers");
const fs = require('node:fs/promises')

const textractClient = new TextractClient({
  region: 'eu-west-3',
  credentials: fromIni({ profile: 'test-pretto-extract' })
})

const getChildrens = (relationShips, all) => {
  return relationShips
    ? relationShips.reduce((acc, curr) => 
      [...acc, ...curr.Ids.map(id => all.find(b => b.Id === id))]
    , [])
    : []
}

const displayBlockInfo = async (response) => {
  const tables = response.Blocks.filter(b => b.BlockType === 'TABLE')
  tables.map(table => {
    const headers = getChildrens(table.Relationships, response.Blocks)
      .filter(b => b.EntityTypes && b.EntityTypes.indexOf('COLUMN_HEADER') >= 0)
      .map(b => ({
        value: getChildrens(b.Relationships, response.Blocks)
                .reduce((acc, curr) => curr.Text ? `${acc} ${curr.Text}` : acc, '')
                .trim(),
        position: { col: b.ColumnIndex, row: b.RowIndex }
      }))
      .filter(b => b.value.length)
    console.log(headers)
  })
  // console.log(tables)
}

const analyze_document_text = async (av) => {
  try {
    const document = await fs.readFile(av[0], 'utf-8')
    const analyzeDoc = new AnalyzeDocumentCommand({
      // Document: { Bytes: Buffer.from(document) },
      Document: { S3Object: {
        Bucket: 'test-pretto-docs',
        Name: 'Allianz-1.png'
      }},
      FeatureTypes: ['TABLES']
    })
    const response = await textractClient.send(analyzeDoc)
    displayBlockInfo(response)
  } catch (err) {
    console.log("Error", err)
  }
}

// analyze_document_text(process.argv.slice(2))
;(async () => {
  displayBlockInfo(require(`./${process.argv[2]}`))
})()
