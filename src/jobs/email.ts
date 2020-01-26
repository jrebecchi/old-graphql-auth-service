/**
 * Module returning the GraphQL schema for the user management API.
 * @module jobs/Email
 */

import Agenda from 'agenda';
import fs from 'fs';
import config from '../config';
import Mailer, { Email } from '../services/mailer/Mailer';

/**
 * Define job type of sending an email in the Agenda process queue.
 * @param  {Agenda} agenda
 * @returns {void}
 */
export default function(agenda: Agenda): void {
    agenda.define('email', async (job: Agenda.Job<Email>) => {
        try {
            await Mailer.send(job.attrs.data);
        } catch (err) {
            console.log(err);
            if (config.emailNotSentLogFile) {
                fs.appendFileSync(config.emailNotSentLogFile, JSON.stringify(job.attrs.data) + '\n');
            }
        }
    });
}
