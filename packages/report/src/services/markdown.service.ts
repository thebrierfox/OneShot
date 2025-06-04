import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';

/**
 * Generates a Markdown report using a Handlebars template and provided data.
 *
 * @param {any} data - The data object to populate the template.
 *                     This data typically comes from `fetchReportData` and should match
 *                     the structure expected by the `report.hbs` template.
 * @returns {Promise<string>} A promise that resolves to the generated Markdown string.
 * @throws {Error} If there is an error reading the template or generating the report.
 */
export async function generateMarkdownReport(data: any): Promise<string> {
  console.log('[MarkdownService] Generating Markdown report...');
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'report.hbs');
    console.log(`[MarkdownService] Reading template from: ${templatePath}`);

    const templateString = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateString);
    
    const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Augment data with additional properties like reportDate if needed by the template
    const templateData = {
        ...data, // Spread the original data
        reportDate: reportDate,
        // summary: data.summary, // Assuming data contains a summary object
        // underPricedItems: data.underPricedItems,
        // overPricedItems: data.overPricedItems,
        // noMatchItems: data.noMatchItems,
        // suggestedActions: data.suggestedActions
    };

    const markdownContent = compiledTemplate(templateData);
    console.log('[MarkdownService] Markdown report generated successfully.');
    return markdownContent;
  } catch (error) {
    console.error('[MarkdownService] Error generating markdown report:', error);
    throw error;
  }
} 