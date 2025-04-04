import Airtable from 'airtable';
import { config } from '../config';

// Initialize this variable to store the base once we have it
let airtableBase: Airtable.Base | null = null;

// Create an async function to initialize Airtable
async function initializeAirtable() {
    if (!airtableBase) {
        const apiKey = await config.getAirtableApiKey();
        Airtable.configure({
            apiKey,
            endpointUrl: 'https://api.airtable.com'
        });
        airtableBase = new Airtable().base(config.airtableBaseId);
    }
    return airtableBase;
}

export const airtableService = {
    async getPatients() {
        try {
            console.log('Fetching patients...');
            const base = await initializeAirtable();
            const records = await base('Patients')
                .select({
                    fields: ['Patient Name'],
                    sort: [{ field: 'Patient Name', direction: 'asc' }]
                })
                .all();
            
            const patients = records.map(record => ({
                id: record.id,
                name: record.get('Patient Name') as string,
            }));
            console.log('Found patients:', patients);
            return patients;
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    },

    async getPatientSessions(patientName: string) {
        try {
            console.log('Fetching sessions for patient name:', patientName);
            const base = await initializeAirtable();
            const records = await base('Sessions')
                .select({
                    fields: ['Session ID', 'Session Date', 'Patient', 'Attendance Status'],
                    filterByFormula: `AND({Patient} = '${patientName}', {Attendance Status} = 'Scheduled')`,
                    sort: [{ field: 'Session Date', direction: 'desc' }]
                })
                .all();
            
            console.log('Raw session records:', records);
            
            return records.map(record => ({
                id: record.id,
                date: record.get('Session Date') 
                    ? new Date(record.get('Session Date') as string).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : 'Data não disponível'
            }));
        } catch (error) {
            console.error('Error fetching sessions:', error);
            throw error;
        }
    },

    async submitCheckIn(patientId: string, sessionId: string) {
        try {
            const base = await initializeAirtable();
            return await base('Check Ins').create([
                {
                    fields: {
                        'Patient': [patientId],
                        'Session ID': [sessionId],
                        'Status': 'Attended',
                        'Created By': 'Cristina Kupfer',
                        'Date': new Date().toISOString()
                    }
                }
            ]);
        } catch (error) {
            console.error('Error submitting check-in:', error);
            throw error;
        }
    }
};