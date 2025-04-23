const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let timers = {};
const ADD_TIME = 2700; // en secondes

const startOrAddTime = (timerId) => {
    if (!timers[timerId]) {
        timers[timerId] = {
            timeRemaining: 0,
            addCount: 0,
            intervalId: null
        };
    }

    timers[timerId].timeRemaining += ADD_TIME;
    timers[timerId].addCount += 1;
    timers[timerId].lastAdd = {
        amount: ADD_TIME,
        timestamp: Date.now()
    };


    // On émet la mise à jour immédiatement après l'ajout
    io.emit('timeUpdate', {
        timerId,
        timeRemaining: timers[timerId].timeRemaining,
        addCount: timers[timerId].addCount
    });

    if (!timers[timerId].intervalId) {
        timers[timerId].intervalId = setInterval(() => {
            if (timers[timerId].timeRemaining <= 0) {
                clearInterval(timers[timerId].intervalId);
                timers[timerId].intervalId = null;
                timers[timerId].timeRemaining = 0;
                io.emit('timeUpdate', {
                    timerId,
                    timeRemaining: 0,
                    addCount: timers[timerId].addCount
                });
                return;
            }

            timers[timerId].timeRemaining -= 1;
            io.emit('timeUpdate', {
                timerId,
                timeRemaining: timers[timerId].timeRemaining,
                addCount: timers[timerId].addCount
            });
        }, 1000);
    }
};

app.get('/start/:timerId', (req, res) => {
    const { timerId } = req.params;
    startOrAddTime(timerId);
    res.json({ message: `+${ADD_TIME}s pour ${timerId}` });
});

app.get('/undo/:timerId', (req, res) => {
    const { timerId } = req.params;
    const timer = timers[timerId];

    if (!timer || !timer.lastAdd) {
        return res.status(400).json({ message: 'Aucun ajout à annuler.' });
    }

    const now = Date.now();
    const diff = (now - timer.lastAdd.timestamp) / 1000;

    if (diff <= 5) {
        timer.timeRemaining -= timer.lastAdd.amount;
        timer.addCount -= 1;
        if (timer.timeRemaining < 0) timer.timeRemaining = 0;
        delete timer.lastAdd;

        io.emit('timeUpdate', {
            timerId,
            timeRemaining: timer.timeRemaining,
            addCount: timer.addCount
        });

        return res.json({ message: `Ajout annulé pour ${timerId}` });
    } else {
        return res.status(400).json({ message: 'Trop tard pour annuler.' });
    }
});

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});
