'use server';

/**
 * @fileOverview A Genkit flow for generating automated service reminders.
 *
 * - automatedServiceReminder - A function that generates personalized service reminders.
 * - AutomatedServiceReminderInput - The input type for the automatedServiceReminder function.
 * - AutomatedServiceReminderOutput - The return type for the automatedServiceReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema Definition
const AutomatedServiceReminderInputSchema = z.object({
  clientName: z.string().describe("The name of the client."),
  serviceLocation: z.string().describe("The primary service location for the client."),
  serviceHistory: z.array(
    z.object({
      date: z.string().describe("The date of the past service in 'YYYY-MM-DD' format."),
      type: z.enum(["extinguisher_maintenance", "fumigation_follow_up"]).describe("The type of service performed."),
      description: z.string().describe("A brief description of the service performed, including relevant details like equipment serviced or areas treated."),
      nextRecommendedDate: z.string().optional().describe("The recommended date for the next service, if applicable, in 'YYYY-MM-DD' format."),
      lastTechnicianNotes: z.string().optional().describe("Any notes from the last technician regarding future service needs.")
    })
  ).describe("A chronological list of past services for the client."),
  currentDate: z.string().describe("The current date in 'YYYY-MM-DD' format, used to determine upcoming services.")
});
export type AutomatedServiceReminderInput = z.infer<typeof AutomatedServiceReminderInputSchema>;

// Output Schema Definition
const AutomatedServiceReminderOutputSchema = z.object({
  reminders: z.array(
    z.object({
      clientName: z.string().describe("The name of the client for whom the reminder is generated."),
      serviceLocation: z.string().describe("The service location relevant to this reminder."),
      serviceType: z.enum(["extinguisher_maintenance", "fumigation_follow_up"]).describe("The type of service this reminder is for."),
      reminderMessage: z.string().describe("A concise, personalized, and professional reminder message for the client."),
      dueDate: z.string().describe("The calculated or recommended due date for the service in 'YYYY-MM-DD' format."),
      priority: z.enum(["low", "medium", "high"]).describe("The urgency of the reminder. 'High' for services due within 7 days, 'Medium' for 8-30 days, 'Low' for beyond 30 days.")
    })
  ).describe("A list of generated service reminders based on the analysis of service history.")
});
export type AutomatedServiceReminderOutput = z.infer<typeof AutomatedServiceReminderOutputSchema>;

// Wrapper function to call the Genkit flow
export async function automatedServiceReminder(input: AutomatedServiceReminderInput): Promise<AutomatedServiceReminderOutput> {
  return automatedServiceReminderFlow(input);
}

// Genkit Prompt Definition
const automatedServiceReminderPrompt = ai.definePrompt({
  name: 'automatedServiceReminderPrompt',
  input: {schema: AutomatedServiceReminderInputSchema},
  output: {schema: AutomatedServiceReminderOutputSchema},
  prompt: `You are an AI assistant for Servifumiga Pro, a company specializing in fire extinguisher maintenance and fumigation services. Your goal is to analyze a client's service history and proactively generate personalized reminders for upcoming maintenance or follow-up services.\n\nThe current date is {{{currentDate}}}. You should identify services that are upcoming, particularly those due within the next 60 days, and generate appropriate reminder messages. For each identified service, provide the client's name, service location, the service type, a detailed reminder message, the recommended due date, and its priority (low, medium, or high).\n\nPrioritize reminders as follows:\n- 'High' for services due within the next 7 days.\n- 'Medium' for services due between 8 and 30 days from the current date.\n- 'Low' for services due between 31 and 60 days from the current date.\n- Do not generate reminders for services due beyond 60 days or if there's no clear next recommended date.\n\nClient Name: {{{clientName}}}\nService Location: {{{serviceLocation}}}\n\nService History:\n{{#each serviceHistory}}\n- Date: {{{date}}}\n  Type: {{{type}}}\n  Description: {{{description}}}\n  {{#if nextRecommendedDate}}\n  Next Recommended Date: {{{nextRecommendedDate}}}\n  {{/if}}\n  {{#if lastTechnicianNotes}}\n  Technician Notes: {{{lastTechnicianNotes}}}\n  {{/if}}\n{{/each}}`
});

// Genkit Flow Definition
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