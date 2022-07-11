const { AnalyzeDocumentCommand, TextractClient } = require('@aws-sdk/client-textract')
const { TextractDocument } = require('amazon-textract-response-parser')
const { fromIni } = require("@aws-sdk/credential-providers")
const fs = require('node:fs/promises')
const path = require('node:path')
const { convertPdfToImage } = require('./image')

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

  statements.map(s => console.table(s))
}

const analyze_document_text = async (av) => {
  try {
    const filename = path.extname(av[0]) === '.pdf'
      ? await convertPdfToImage(av[0], 'document.jpg')
      : av[0]
    const document = await fs.readFile(filename)
    const analyzeDoc = new AnalyzeDocumentCommand({
      Document: { Bytes: Buffer.from(document) },
      FeatureTypes: ['TABLES']
    })
    const response = await textractClient.send(analyzeDoc)
    displayBlockInfo(response)
  } catch (err) {
    console.log("Error", err)
  }
}

analyze_document_text(process.argv.slice(2))
