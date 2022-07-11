# aws-textract-parser

## How to use

- Create a IAM user with `AmazonTextractFullAccess` right
- Run `sudo apt install imagemagick`
- Run `sudo apt install ghostscript`
- Change the profile / region for AWS in the `index.js` file
- Run `node index.js /path/to/your/file`

Your file can either be an image file or a pdf. PDF files will be transformed to images thanks to `image.js` file. Be free to change options
