'use server';

/**
 * @fileOverview A Genkit flow for generating automated service reminders for extinguishers.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedServiceReminderInputSchema = z.object({
  clientName: z.string().describe("The name of the client."),
  serviceLocation: z.string().describe("The primary service location for the client."),
  serviceHistory: z.array(
    z.object({
      date: z.string().describe("The date of the past service in 'YYYY-MM-DD' format."),
      type: z.enum(["extinguisher_maintenance", "extinguisher_inspection", "extinguisher_recharge", "extinguisher_rental"]).describe("The type of fire extinguisher service performed."),
      description: z.string().describe("A brief description of the service performed."),
      nextRecommendedDate: z.string().optional().describe("The recommended date for the next service."),
      lastTechnicianNotes: z.string().optional().describe("Any notes from the last technician.")
    })
  ).describe("A chronological list of past extinguisher services."),
  currentDate: z.string().describe("The current date in 'YYYY-MM-DD' format.")
});
export type AutomatedServiceReminderInput = z.infer<typeof AutomatedServiceReminderInputSchema>;

const AutomatedServiceReminderOutputSchema = z.object({
  reminders: z.array(
    z.object({
      clientName: z.string().describe("The name of the client."),
      serviceLocation: z.string().describe("The service location."),
      serviceType: z.enum(["extinguisher_maintenance", "extinguisher_inspection", "extinguisher_recharge", "extinguisher_rental"]).describe("The type of service."),
      reminderMessage: z.string().describe("A personalized reminder message about their fire safety equipment."),
      dueDate: z.string().describe("The recommended due date."),
      priority: z.enum(["low", "medium", "high"]).describe("Urgency based on proximity to due date.")
    })
  ).describe("A list of generated extinguisher service reminders.")
});
export type AutomatedServiceReminderOutput = z.infer<typeof AutomatedServiceReminderOutputSchema>;

export async function automatedServiceReminder(input: AutomatedServiceReminderInput): Promise<AutomatedServiceReminderOutput> {
  return automatedServiceReminderFlow(input);
}

const automatedServiceReminderPrompt = ai.definePrompt({
  name: 'automatedServiceReminderPrompt',
  input: {schema: AutomatedServiceReminderInputSchema},
  output: {schema: AutomatedServiceReminderOutputSchema},
  prompt: `You are an AI assistant for Servifumiga Pro, specializing in fire extinguisher management (NTP 350.043-1). Your goal is to analyze client extinguisher history and generate reminders for upcoming maintenance, inspection, or recharge.\n\nThe current date is {{{currentDate}}}.\n\nPrioritize reminders:\n- 'High' for services due within 7 days.\n- 'Medium' for 8-30 days.\n- 'Low' for 31-60 days.\n\nClient: {{{clientName}}}\nLocation: {{{serviceLocation}}}\n\nHistory:\n{{#each serviceHistory}}\n- Date: {{{date}}}\n  Type: {{{type}}}\n  Notes: {{{lastTechnicianNotes}}}\n  Next Due: {{{nextRecommendedDate}}}\n{{/each}}`
});

const automatedServiceReminderFlow = ai.defineFlow(
  {
    name: 'automatedServiceReminderFlow',
    inputSchema: AutomatedServiceReminderInputSchema,
    outputSchema: AutomatedServiceReminderOutputSchema,
  },
  async (input) => {
    const {output} = await automatedServiceReminderPrompt(input);
    return output!;
  }
);
