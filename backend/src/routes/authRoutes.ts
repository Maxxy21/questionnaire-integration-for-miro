import express, {NextFunction, Request, Response} from 'express';
import {MiroUser} from "../entities/MiroUser";
import dataSource from "../ormconfig";
import {Questionnaire} from "../entities/Questionnaire";
import {Team} from "../entities/Team";
import passport from "../passportSetup";

const router = express.Router();

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');  // Or wherever you want to redirect unauthenticated users
}

router.get('/api/verifyUser', async (req, res) => {
    const userId = req.query.userId;

    if (typeof userId !== 'string') {
        // Handle the error (send a response or throw an exception)
        return res.status(400).send("Invalid userId");
    }

    if (!userId) {
        return res.status(400).json({message: 'userId is missing in the request'});
    }


    const user = await dataSource.manager.findOne(MiroUser, {where: {id: userId}});

    if (user) {
        res.status(200).json({message: 'MiroUser exists', verified: true});
    } else {
        res.status(404).json({message: 'MiroUser not found', verified: false});
    }
});


router.post('/api/teams/login', async (req, res) => {
    const {teamName} = req.body;

    if (!teamName) {
        return res.status(400).json({message: 'teamName is missing in the request'});
    }

    let team = await dataSource.manager.findOne(Team, {where: {name: teamName}});

    if (!team) {
        team = dataSource.manager.create(Team, {name: teamName});
        await dataSource.manager.save(Team, team);
    }

    let user = await dataSource.manager.findOne(MiroUser, {where: {team: team}});

    if (!user) {
        user = dataSource.manager.create(MiroUser, {team});
        await dataSource.manager.save(MiroUser, user);
    }

    // You don't need another 'if (team)' check here as it will always exist at this point

    // Return both user ID and team ID to the client
    res.status(200).json({userId: user.id, teamId: team.id, message: 'Logged in successfully!'});
});

router.post('/api/questionnaire/submit', async (req, res) => {
    const {teamId, ...otherFormData} = req.body;

    if (!teamId) {
        return res.status(400).json({message: 'teamId is missing in the request'});
    }

    try {
        const questionnaire = dataSource.manager.create(Questionnaire, {
            ...otherFormData,
            team: {id: teamId}
        });

        await dataSource.manager.save(Questionnaire, questionnaire);

        res.status(200).json({message: 'Data submitted successfully'});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({message: 'Error processing the request'});
    }
});

router.post('/api/miro/userInfo', async (req, res) => {
    const {userInfo, onlineUsers} = req.body;

    const user = dataSource.manager.create(MiroUser, userInfo);
    await dataSource.manager.save(MiroUser, user);


    for (const onlineUser of onlineUsers) {
        const user = dataSource.manager.create(MiroUser, onlineUser);
        await dataSource.manager.save(MiroUser, user);
    }

    res.status(200).json({message: 'Miro user info saved successfully'});
});


router.get('/auth/miro',
    passport.authenticate('oauth2') // Start authentication
);

router.get('/auth/miro/callback',
    passport.authenticate('oauth2', {failureRedirect: '/login'}),
    function (req, res) {
        res.redirect('/');
    }
);

router.get('/logout', (req, res) => {
    (req.logout as any)();
    res.redirect('/login');  // Redirect to the login page or homepage after logout
});


router.get('/some_protected_route', ensureAuthenticated, (req, res) => {
//Todo
});


export default router;
