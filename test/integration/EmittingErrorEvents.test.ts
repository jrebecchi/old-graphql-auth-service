import AppTester from '../utils/AppTester';
import { eventBus } from '../../src/index';

let appTester;
let request;

let user = {
    username: "username",
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "Logger",
        },
        emailConfig: {
            host: 'wrong',
            port: 587,
            auth: {
                user: 'wrong',
                pass: 'wrong'
            }
        },
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                await appTester.register(user);
                done();
            } catch (err) {
                done(err);
            }
        },
    });
}, 40000);

const wait = (time) => new Promise<void>((resolve) => setTimeout(resolve, time))

test('Email Error - Event Emitting', async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendPasswordRecorevyEmail(email: "${user.email}"){
              notifications{
                type
                message
              }
            }
          }`
    }
    eventBus.on('email-error', (data) => {
        expect(data.locals.user.username).toBe(user.username);
        expect(data.recipient).toBe(user.email);
        done();
    })
    await wait(10000)
    await request.getGraphQL(recoveryEmailQuery);
}, 20000);

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);