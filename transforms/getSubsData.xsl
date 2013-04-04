<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" />

	<!-- USED TO GET ALL DATA NEEDED TO CONSTRUCT gSubs[]-->
	<xsl:template match="subs">
		<subs>
			<xsl:for-each select="sub">
				<sub><xsl:value-of select="sub_id"/>|<xsl:value-of select="sub_title"/>|<xsl:value-of select="sub_orig_title"/>|<xsl:value-of select="sub_link"/>|0|<xsl:value-of select="sub_copy"/>|0|0</sub>
			</xsl:for-each>
		</subs>
	</xsl:template>

</xsl:stylesheet>