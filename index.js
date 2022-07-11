const { AnalyzeDocumentCommand, TextractClient } = require('@aws-sdk/client-textract')
const { TextractDocument } = require('amazon-textract-response-parser')
const { fromIni } = require("@aws-sdk/credential-providers");
const fs = require('node:fs/promises')

const textractClient = new TextractClient({
  region: 'eu-west-3',
  credentials: fromIni({ profile: 'test-pretto-extract' })
})

const displayBlockInfo = async (response) => {
  const doc = new TextractDocument(response)
  const statements = doc.listPages().reduce((s, p) =>
    [...s, ...p.listTables().reduce((tables, table) =>
      [...tables, table.listRows().slice(1).map(row =>
        row.listCells()
          .reduce((o, c) => (
            {...o,
              [table.cellAt(1, c.columnIndex).text.trim()]: c.text.trim()
            }
          ), {})
        )
      ], [])
    ], [])

  console.log(statements[0])


  // Iterate over rows/cells:
  // for (const row of table.iterRows()) {
  //   for (const cell of row.iterCells()) {
  //     console.log(cell.text);
  //   }
  // }
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
