'use server';
/**
 * @fileOverview A Genkit flow that generates a concise summary of a client's past fire safety service history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ServiceHistorySummaryInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  serviceHistory: z.string().optional().describe('The fire extinguisher service history documentation.'),
});
export type ServiceHistorySummaryInput = z.infer<typeof ServiceHistorySummaryInputSchema>;

const ServiceHistorySummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary focusing on extinguisher status and compliance.'),
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
  prompt: `You are an AI specialized in fire safety equipment maintenance summaries.
Goal: Provide a professional summary of extinguisher services for the technician.

Client Name: {{{clientName}}}

{{#if serviceHistory}}
Service History:
"""{{{serviceHistory}}}"""

Summarize the history focusing on the last maintenance date, number of extinguishers, and any pending recharges or critical safety issues.
{{else}}
No service history provided for {{{clientName}}}.
{{/if}}`,
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
