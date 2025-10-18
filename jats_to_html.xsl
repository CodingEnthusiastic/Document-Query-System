<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:mml="http://www.w3.org/1998/Math/MathML">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="//article-title"/></title>
        <script id="MathJax-script" async="async" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>        <style>
          @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&amp;family=Roboto:wght@400;700&amp;display=swap');

          body {
            font-family: 'Lora', serif;
            line-height: 1.6;
            color: #333;
            background-color: #fdfdfd;
            margin: 0;
            padding: 0;
          }

          .container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: 'Roboto', sans-serif;
            font-weight: 700;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #2c3e50;
          }

          h1 {
            font-size: 2.2em;
            text-align: center;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5em;
            margin-bottom: 1em;
          }

          h2 {
            font-size: 1.8em;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 0.3em;
          }

          p {
            margin-bottom: 1em;
            text-align: justify;
          }

          .abstract {
            background-color: #ecf0f1;
            border-left: 5px solid #3498db;
            padding: 1.5em;
            margin: 2em 0;
            font-style: italic;
          }
          
          .abstract p {
            text-align: left;
          }

          .authors {
            text-align: center;
            margin-bottom: 2em;
            font-family: 'Roboto', sans-serif;
            color: #7f8c8d;
          }

          .fig {
            margin: 2em 0;
            text-align: center;
          }

          .fig img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px;
          }

          .fig .caption {
            margin-top: 0.5em;
            font-size: 0.9em;
            font-style: italic;
            color: #555;
          }

          table-wrap {
            margin: 2em 0;
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-family: 'Roboto', sans-serif;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }

          th {
            background-color: #f2f2f2;
            font-weight: 700;
          }

          .ref-list .ref {
            margin-bottom: 1em;
            font-size: 0.9em;
          }
          
          a {
            color: #3498db;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }

        </style>
      </head>
      <body>
        <div class="container">
          <xsl:apply-templates/>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="article-title">
    <h1><xsl:value-of select="."/></h1>
  </xsl:template>

  <xsl:template match="contrib-group">
    <div class="authors">
      <xsl:for-each select="contrib[@contrib-type='author']">
        <xsl:value-of select="name/surname"/>
        <xsl:if test="name/given-names">
          <xsl:text>, </xsl:text>
          <xsl:value-of select="name/given-names"/>
        </xsl:if>
        <xsl:if test="position() != last()">
          <xsl:text>; </xsl:text>
        </xsl:if>
      </xsl:for-each>
    </div>
  </xsl:template>

  <xsl:template match="abstract">
    <div class="abstract">
      <h2>Abstract</h2>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <xsl:template match="body">
    <div class="body">
      <xsl:apply-templates/>
    </div>
  </xsl:template>
  
  <xsl:template match="p | title | sec-meta">
    <xsl:copy>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="fig">
    <div class="fig">
      <xsl:apply-templates select="label"/>
      <xsl:apply-templates select="caption"/>
      <!-- Note: This assumes graphic/@href points to an image. This might need adjustment based on actual XML structure -->
      <img>
        <xsl:attribute name="src">
          <xsl:value-of select=".//graphic/@href"/>
        </xsl:attribute>
        <xsl:attribute name="alt">
          <xsl:value-of select="caption"/>
        </xsl:attribute>
      </img>
    </div>
  </xsl:template>
  
  <xsl:template match="caption">
    <div class="caption">
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <xsl:template match="table-wrap">
    <div class="table-wrap">
      <xsl:apply-templates select="label"/>
      <xsl:apply-templates select="caption"/>
      <xsl:apply-templates select="table"/>
    </div>
  </xsl:template>
  
  <xsl:template match="table | thead | tbody | tr | th | td">
    <xsl:copy>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="ref-list">
    <div class="ref-list">
      <h2>References</h2>
      <xsl:apply-templates/>
    </div>
  </xsl:template>

  <xsl:template match="ref">
    <div class="ref">
      <xsl:apply-templates/>
    </div>
  </xsl:template>
  
  <xsl:template match="ext-link">
    <a>
      <xsl:attribute name="href">
        <xsl:value-of select="@href"/>
      </xsl:attribute>
      <xsl:value-of select="."/>
    </a>
  </xsl:template>

  <xsl:template match="mml:math | mml:math//*">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>

  <!-- Ignore elements that are not explicitly handled -->
  <xsl:template match="text() | @*">
    <xsl:copy/>
  </xsl:template>
  
  <xsl:template match="front | article-meta | journal-meta | pub-date | permissions | license | self-uri | kwd-group | funding-group | notes | back | fn-group | ack"/>

</xsl:stylesheet>