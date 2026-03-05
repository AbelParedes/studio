'use server';
/**
 * @fileOverview A Genkit flow that generates a concise summary of a client's past service history or specific fumigation documentation.
 *
 * - serviceHistorySummary - A function that handles the generation of the service history summary.
 * - ServiceHistorySummaryInput - The input type for the serviceHistorySummary function.
 * - ServiceHistorySummaryOutput - The return type for the serviceHistorySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ServiceHistorySummaryInputSchema = z.object({
  clientName: z.string().describe('The name of the client for whom the summary is being generated.'),
  serviceHistory: z.string().optional().describe('The comprehensive service history documentation for the client.'),
  fumigationDocumentation: z.string().optional().describe('Specific documentation related to fumigation services.'),
});
export type ServiceHistorySummaryInput = z.infer<typeof ServiceHistorySummaryInputSchema>;

const ServiceHistorySummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the client\'s service history or fumigation documentation.'),
});
export type ServiceHistorySummaryOutput = z.infer<typeof ServiceHistorySummaryOutputSchema>;

export async function serviceHistorySummary(
  input: ServiceHistorySummaryInput
): Promise<ServiceHistorySummaryOutput> {
  return serviceHistorySummaryFlow(input);
}

const summaryPrompt = ai.definePrompt({
  name: 'serviceHistorySummaryPrompt',
  input: {schema: ServiceHistorySummaryInputSchema},
  output: {schema: ServiceHistorySummaryOutputSchema},
  prompt: `You are an AI assistant designed to provide concise summaries of service histories and fumigation documentation.
Your goal is to help service technicians or managers quickly grasp key details without reviewing extensive records.

Client Name: {{{clientName}}}

{{#if fumigationDocumentation}}
Fumigation Documentation:
"""{{{fumigationDocumentation}}}"""

Provide a concise summary of the fumigation documentation for {{{clientName}}}, highlighting key chemicals used, areas treated, and post-service recommendations. If relevant, also incorporate any general service history provided.
{{else if serviceHistory}}
Service History:
"""{{{serviceHistory}}}"""

Provide a concise summary of the service history for {{{clientName}}}, focusing on important dates, types of services performed, and any recurring issues or special notes.
{{else}}
No service history or fumigation documentation was provided for {{{clientName}}}. Please indicate this.
{{/if}}

Generate the summary in a professional and easy-to-understand format.`,
});

const serviceHistorySummaryFlow = ai.defineFlow(
  {
    name: 'serviceHistorySummaryFlow',
    inputSchema: ServiceHistorySummaryInputSchema,
    outputSchema: ServiceHistorySummaryOutputSchema,
  },
  async input => {
    const {output} = await summaryPrompt(input);
    return output!;
  }
);
