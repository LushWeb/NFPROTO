<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes" cdata-section-elements="header article" />

    <xsl:template match="/">
    	<items>
    		<xsl:apply-templates select="files/file"/>							
    	</items>
    </xsl:template>

    <xsl:template match="file">
    	<xsl:copy-of select="document(.)/items/item"/>
    </xsl:template>
    
</xsl:stylesheet>