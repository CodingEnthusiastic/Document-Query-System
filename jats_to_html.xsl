<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
      xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <title><xsl:value-of select="//article-title"/></title>
        <style>
          body { font-family: sans-serif; margin: 2em; }
          h1   { text-align: center; }
        </style>
      </head>
      <body>
        <h1><xsl:value-of select="//article-title"/></h1>
        <h2>Abstract</h2>
        <xsl:copy-of select="//abstract/*"/>
        <h2>Body</h2>
        <xsl:copy-of select="//body/*"/>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
