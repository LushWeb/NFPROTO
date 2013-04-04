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
		<xsl:choose>
			<xsl:when test="$seltype='ALL'">
				<xsl:for-each select="items/item[status=$status]">
					<xsl:sort select="*[name()=$sortfield]" order="{$sortorder}" />
					<xsl:call-template name="doComplete" />
				</xsl:for-each>
			</xsl:when>
			<xsl:when test="$seltype='SUB'">
				<xsl:for-each select="items/item[sub_id=$subid and status=$status]">
					<xsl:sort select="*[name()=$sortfield]" order="{$sortorder}" />
					<xsl:call-template name="doComplete" />
				</xsl:for-each>
			</xsl:when>
			<xsl:when test="$seltype='GRP'">
				<xsl:call-template name="doGrpComplete" />
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="doGrpComplete">
		<xsl:for-each select="items/item[status=$status]">
			<xsl:sort select="*[name()=$sortfield]" order="{$sortorder}" />
				<xsl:variable name="cSubID"><xsl:text>-</xsl:text><xsl:value-of select="sub_id"/><xsl:text>-</xsl:text></xsl:variable>
				<xsl:if test="contains($grpidlist, $cSubID)"><xsl:call-template name="doComplete" /></xsl:if>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="doComplete">
		<div class="i-w" id="art_{item_id}" onmouseover="sip({item_id});" onmouseout="hip({item_id});">
			<div class="a-main">
				<div id="cog_{item_id}" class="cog-o-off"><div id="cog_{sub_id}" class="cog-i" onmouseover="sopt(this);">Options</div></div>
				<p class="i-t"><a id="ml_{item_id}" title="Read full article..." target="_blank" href="{header_link}" onclick="ftl({item_id},{sub_id});"><xsl:value-of select="header" disable-output-escaping="yes" /></a></p>
				<p class="i-s">
					<a target="_blank" title="Visit site..." href="{source_link}"><xsl:value-of select="source" disable-output-escaping="yes" /></a>
					<xsl:if test="author!=''"><xsl:text> [ </xsl:text><xsl:value-of select="author"/><xsl:text> ]</xsl:text></xsl:if>
				</p>
				<p class="i-d"><xsl:value-of select="interval"/></p>
				<hr class="i-par"/>
				<div class="i-t-w"><xsl:value-of select="article" disable-output-escaping="yes"/></div>
				<div class="i-e-off" id="mtt_{item_id}" onclick="mtt(this);">Go to top</div>
			</div>
		</div>
	</xsl:template>
</xsl:stylesheet>