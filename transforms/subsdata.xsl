<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" indent="yes" version="1.0" encoding="UTF-8" standalone="yes" />

	<!-- USED TO GET ALL DATA NEEDED TO CONSTRUCT gStructure[]-->
	<xsl:template match="grps">
		<subs>
			<xsl:for-each select="grp">
				<xsl:variable name="subgrpid">
					<xsl:value-of select="grp_id"/>
				</xsl:variable>
				<xsl:variable name="subgrpname">
					<xsl:value-of select="grp_name"/>
				</xsl:variable>
				<xsl:for-each select="subs/sub">
					<sub><xsl:value-of select="$subgrpid"/>|<xsl:value-of select="$subgrpname"/>|<xsl:value-of select="sub_id"/>|<xsl:value-of select="sub_title"/>|<xsl:value-of select="sub_link"/>|<xsl:value-of select="sub_update"/>||0|<xsl:value-of select="minimal"/></sub>
				</xsl:for-each>
			</xsl:for-each>
		</subs>
	</xsl:template>

</xsl:stylesheet>