const AppTester = require('../utils/AppTester');
const jwt = require('jsonwebtoken');
const config = require('../../lib/config')

let appTester;
let request;
let token1;
let token2;
let token3;
let token4;
let user1 = {
    username: "username",
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

let user2 = {
    username: "username2",
    email: "test2@test.com",
    password: "password2",
    firstName: "firstname2",
    lastName: "lastname2",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

let user3 = {
    username: "username3",
    email: "test3@test.com",
    password: "password3",
    firstName: "firstname3",
    lastName: "lastname3",
    age: 24,
    gender: "Mrs",
    receiveNewsletter: true
};

let user4 = {
    username: "username4",
    email: "test4@test.com",
    password: "password4",
    firstName: "firstname4",
    lastName: "lastname4",
    age: 28,
    gender: "Mrs",
    receiveNewsletter: true
};

let updates = {
    username: "otherUsername",
    email: "otheremail@mail.com",
    password: "tototototo"
}

beforeAll((done) => {
    appTester = new AppTester({
        dbConfig: {
            userDB: "UpdateMeTest"
        },
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                let res = await appTester.register(user1);
                res = await appTester.register(user2);
                res = await appTester.register(user3);
                res = await appTester.register(user4);
                res = await appTester.login(user1.email, user1.password);
                token1 = res.data.login.token;
                res = await appTester.login(user2.email, user2.password);
                token2 = res.data.login.token;
                res = await appTester.login(user4.email, user4.password);
                token4 = res.data.login.token;
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test('Update usersname - email - password', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{username:"${updates.username}" email: "${updates.email}" password: "${updates.password}" previousPassword:"${user1.password}"}){
              user{
                username
                verified
                _id
                email
              }
              notifications{
                type
                message
              }
            }
          }`
    }

    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ username: user1.username });
    let res = await request.postGraphQL(query, token1, refreshToken);

    expect(res.data.updateMe.notifications[0].type).toBe("SUCCESS");
    expect(res.data.updateMe.user.email).toBe("otheremail@mail.com");
    expect(res.data.updateMe.user.username).toBe("otherUsername");

    res = await appTester.login(user1.email, user1.password)
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();

    res = await appTester.login(updates.email, updates.password);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    token1 = res.data.login.token
    jwt.verify(res.data.login.token, config.publicKey, { algorithm: 'RS256' }, async (err, userDecrypted) => {
        if (err) {
            done(new Error('Wrong token'));
        } else {
            expect(typeof userDecrypted._id === "string").toBeTruthy();
            expect(userDecrypted._id.length > 5).toBeTruthy();
            expect(userDecrypted.email).toBe(updates.email);
            expect(userDecrypted.username).toBe(updates.username);
            expect(userDecrypted.verified).toBe(false);
            expect(userDecrypted.age).toBe(user1.age);
            expect(userDecrypted.receiveNewsletter).toBe(user1.receiveNewsletter);
            expect(userDecrypted.gender).toBe(user1.gender);
            expect(userDecrypted.firstName).toBe(user1.firstName);
            expect(userDecrypted.lastName).toBe(user1.lastName);
            done();
        }
    });
});

test('Wrong previous password', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{password: "newpassword" previousPassword:"wrongpassword"}){
              notifications{
                type
                message
              }
            }
          }`
    }
    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ username: user2.username });
    let res = await request.postGraphQL(query, token2, refreshToken);
    expect(res.errors[0].message.includes("Your previous password is wrong!")).toBeTruthy();


    let loginQuery = {
        query: `mutation{
            login(login:"${user2.email}" password:"newpassword"){
            token
        }}`
    }
    res = await request.postGraphQL(loginQuery);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    done();
});

test('Password too short', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{password: "toto" previousPassword:"${user2.password}"}){
              notifications{
                type
                message
              }
            }
          }`
    }

    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ username: user2.username });
    let res = await request.postGraphQL(query, token2, refreshToken);
    expect(res.errors[0].message.includes("The password must contain at least 8 characters")).toBeTruthy();


    let loginQuery = {
        query: `mutation{
            login(login:"${user2.email}" password:"toto"){
            token
        }}`
    }
    res = await request.postGraphQL(loginQuery);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    done();
});

test('Username too short', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{username: "Yo"}){
              notifications{
                type
                message
              }
            }
          }`
    }

    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ email: user4.email });
    let res = await request.postGraphQL(query, token4, refreshToken);
    expect(res.errors[0].message.includes("The username must contains more than 4 characters!")).toBeTruthy();
    done();
});

test('Username already exists', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{username: "${user2.username}"}){
              notifications{
                type
                message
              }
            }
          }`
    }

    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ email: user4.email });
    let res = await request.postGraphQL(query, token4, refreshToken);
    expect(res.errors[0].message.includes("Username already exists")).toBeTruthy();
    done();
});

test('Email already exists', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{email: "${user2.email}"}){
              notifications{
                type
                message
              }
            }
          }`
    }

    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ username: user4.username });
    let res = await request.postGraphQL(query, token4, refreshToken);
    expect(res.errors[0].message.includes("Email already exists")).toBeTruthy();
    done();
});

test('Wrong gender', async (done) => {

    const query = {
        query: `mutation{
            updateMe(fields:{gender: Mutant}){
              notifications{
                type
                message
              }
            }
          }`
    }
    const UserModel = require('../../lib/model/UserModel');
    const { refreshToken } = await UserModel.getUser({ email: user4.email });
    let res = await request.postGraphQL(query, token4, refreshToken);
    expect(res.errors[0].message.includes("found Mutant")).toBeTruthy();
    done();
});

test('Update email of a verified user', async (done) => {
    const UserModel = require('../../lib/model/UserModel');
    await UserModel.updateUser({ username: user3.username }, { verified: true });
    let res = await appTester.login(user3.email, user3.password);
    token3 = res.data.login.token;
    const newEmail = "yoyo@whatever.com";
    const query = {
        query: `mutation{
            updateMe(fields:{email: "${newEmail}"}){
              notifications{
                type
                message
              }
            }
          }`
    }

    const { refreshToken } = await UserModel.getUser({ email: user3.email });
    res = await request.postGraphQL(query, token3, refreshToken);
    expect(res.data.updateMe.notifications.filter(notif => notif.message.includes("You will receive a confirmation link at your email address in a few minutes")).length).toBe(1);
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);