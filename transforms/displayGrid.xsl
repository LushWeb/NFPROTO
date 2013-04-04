<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" indent="yes" encoding="UTF-8" />
	<xsl:param name="seltype" />
	<xsl:param name="subid" />
	<xsl:param name="grpidlist" />
	<xsl:param name="sortfield" />
	<xsl:param name="sortorder" />
	<xsl:param name="status" />
	
	<xsl:template match="/">
		<table id="t-read" class="rg">
		<xsl:choose>
			<xsl:when test="$seltype='ALL'">
				<xsl:for-each select="items/item[status=$status]">
					<xsl:sort select="*[name()=$sortfield]" order="{$sortorder}" />
					<xsl:call-template name="doGrid" />
				</xsl:for-each>
			</xsl:when>
			<xsl:when test="$seltype='SUB'">
				<xsl:for-each select="items/item[sub_id=$subid and status=$status]">
					<xsl:sort select="*[name()=$sortfield]" order="{$sortorder}" />
					<xsl:call-template name="doGrid" />
				</xsl:for-each>
			</xsl:when>
			<xsl:when test="$seltype='GRP'">
				<xsl:call-template name="doGrpGrid" />
			</xsl:when>
			<xsl:otherwise>
				<p>Invalid select statement!</p>
			</xsl:otherwise>
		</xsl:choose>
		</table>
	</xsl:template>
	
	<xsl:template name="doGrpGrid">
		<xsl:for-each select="items/item[status=$status]">
			<xsl:sort select="*[name()=$sortfield]" order="{$sortorder}" />
				<xsl:variable name="cSubID"><xsl:text>-</xsl:text><xsl:value-of select="sub_id"/><xsl:text>-</xsl:text></xsl:variable>
				<xsl:if test="contains($grpidlist, $cSubID)"><xsl:call-template name="doGrid" /></xsl:if>
		</xsl:for-each>
	</xsl:template>
	
	<xsl:template name="doGrid">
		<!-- Read Items (shorter table version) -->
		<tr class="rg-r" id="art_{item_id}">
			<td class="r-c-d"><xsl:value-of select="interval"/></td>
			<td class="r-c-p"> + </td>
			<td class="r-c-t"><a target="_blank" href="{header_link}"><xsl:value-of select="header" disable-output-escaping="yes" /></a></td>
			<td class="r-c-f"><a target="_blank" href="{source_link}"><xsl:value-of select="source" disable-output-escaping="yes" /></a>
			<xsl:if test="author!=''"><xsl:text> [ </xsl:text><xsl:value-of select="author"/><xsl:text> ]</xsl:text></xsl:if></td>
			<td class="r-c-o" id="cog_{sub_id}" onmouseover="sopt(this);">Options</td>
 		</tr>
	</xsl:template>
	
</xsl:stylesheet>