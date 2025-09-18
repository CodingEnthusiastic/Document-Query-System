from flask import Flask, send_file
from lxml import etree
import pdfkit, io

app = Flask(__name__)
XSLT_PATH = "jats_to_html.xsl"
XML_PATH = "pygetpapers_terpene_1758205714\\PMC12430370\\fulltext.xml"

config = pdfkit.configuration(
    wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
)

@app.route("/pdf")
def xml_to_pdf():
    # Transform JATS XML -> HTML
    dom = etree.parse(XML_PATH)
    xslt = etree.parse(XSLT_PATH)
    html_str = str(etree.XSLT(xslt)(dom))

    # HTML -> PDF (bytes)
    pdf_bytes = pdfkit.from_string(html_str, False, configuration=config)  # False = return bytes

    # Stream to browser
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=False,
        download_name="article.pdf"
    )

if __name__ == "__main__":
    app.run(debug=True)


