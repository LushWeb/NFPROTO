<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" />
	<xsl:param name="itemstatus" />
	
	<xsl:key name="uniqueUnreadSub" match="item[status=$itemstatus]" use="sub_id" />
	
	<xsl:template match="/">
		<counts>
			<xsl:apply-templates />
		</counts>
	</xsl:template>

	<xsl:template match="item [generate-id()=generate-id(key('uniqueUnreadSub', sub_id)[1])]">
 	
 		<count>
 			<cid><xsl:value-of select="sub_id" /></cid>
 			<cidcount><xsl:value-of select="count(key('uniqueUnreadSub', sub_id))" /></cidcount>
 		</count>
 
 	</xsl:template>

 	<xsl:template match="text()"/>
 	
</xsl:stylesheet>