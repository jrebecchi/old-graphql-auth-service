import AppTester from '../utils/AppTester';
import jwt from 'jsonwebtoken';
import config from '../../src/config';

let appTester;
let request;
let token
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

let user2 = {
    username: "username2",
    email: "test2@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/ConfirmEmailTest",
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                await appTester.register(user);
                await appTester.register(user2);
                const res = await appTester.login(user.email, user.password);
                token = res.data.login.token;
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test("Confirm email", async (done) => {
    const recoveryEmailQuery = {
        query: `query{
            sendVerificationEmail{
              notifications{
                type
                message
              }
            }
          }`
    }
    let res = await request.getGraphQL(recoveryEmailQuery, token);
    expect(res.data.sendVerificationEmail.notifications[0].message.includes("You will receive a confirmation link at your email address in a few minutes")).toBeTruthy();
    
    
    
    const UserModel = require('../../src/model/UserModel').default;
    const userRetrieved = await UserModel.getUser({username: user.username}, {verified: true});
    res = await request.get("/user/email/confirmation?token="+userRetrieved.verificationToken);
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("You are now verified")).toBeTruthy();
    done();
});

test("wrong verify token", async (done) => {
    const res = await request.get("/user/email/confirmation?token=" + "WRONGTOKEN");
    expect(res.statusCode).toBe(200);
    expect(res.text.includes("This link is not valid!")).toBeTruthy();
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);