const express = require('express');
const app = express();
const bodyParser = require("body-parser")

require('dotenv').config();

const mongodb = require('mongodb')

const mongoClient = mongodb.MongoClient;


const dbUrl = process.env.DB_URL ;

const port = process.env.PORT || 3000;

app.get("/", function (req, res) {

    res.sendFile(__dirname + "/index.html")


})

app.get("/showMentors", async function (req, res) {

    try {
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('stud_mentor');

        let listOfMentors = await db.collection('mentors').find().toArray();
        res.send(listOfMentors);
        clientInfo.close();

    }
    catch (error) {
        console.log('error')
    }

})


app.get("/showStudents", async function (req, res) {

    try {
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('stud_mentor');

        let listOfStudents = await db.collection('students').find().toArray();
        res.send(listOfStudents);
        clientInfo.close();

    }
    catch (error) {
        console.log('error')
    }

})

app.get("/showAssign", async function (req, res) {

    try {
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('stud_mentor');

        let data = await db.collection('assign').find().toArray();
        res.send(data);
        clientInfo.close();

    }
    catch (error) {
        console.log('error')
    }

})


//OzQhEmUYyn1WrHsv
app.use(express.urlencoded({ extended: false }));




app.post("/mentorlist", async function (req, res) {




    try {

        var mentorId = req.body.mentorId
        var mentorName = req.body.mentorName;
        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('stud_mentor');

        var userData = {
            _id: mentorId,
            "mentorName": mentorName
        };

        db.collection("mentors").insertOne(userData, function (err, data) {
            if (err) throw err;
            console.log("inserted");

        });

        let data = await db.collection('mentors').find().toArray();
        res.send(data)
        clientInfo.close()

    }
    catch (error) {
        console.log('error')
    }

})



app.post("/studentlist", async function (req, res) {

  


    try {
        var studentName = req.body.studentName;
        var studentId = req.body.studentId;

        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('stud_mentor');

        var student = {
            _id: studentId,
            "studentName": studentName
        }
        console.log('1');
        db.collection("students").insertOne(student, function (err, data) {
            if (err) throw err;
            console.log("inserted");
        })
      console.log('2');
        let data = await db.collection("students").find().toArray();
        res.status(200).json(data)
        clientInfo.close();

    }
    catch (error) {
        console.log("error");
    }




})


app.post("/assignmentor", async function (req, res) {

    try {

        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db("stud_mentor")


        let Mentor = req.body.Mentor;
        let student1 = req.body.student1;
        let student2 = req.body.student2;

        let mentorCollection = await db.collection('mentors').find({ mentorName: Mentor }).toArray();
        let studentList1 = await db.collection('students').find({ "studentName": student1 }).toArray();
        let studentList2 = await db.collection('students').find({ "studentName": student2 }).toArray();

        let mentoredStudent = await db.collection('mentoredStudent').find({ _id: '1' }).toArray();

        let msg = '';
        let flag = 0;

        let userStud = []
        let mentoredStudentArr;
        if (mentorCollection.length === 0) {
            msg = 'Mentor not found';
            res.status(400).json({ message: msg })
            clientInfo.close()
        }
        console.log(studentList1);
        if (studentList1.length === 0 || studentList2.length === 0) {
            msg = 'Students not found';
            res.status(400).json({ message: msg })
            clientInfo.close()
        }

        if (mentoredStudent.length) {


            mentoredStudentArr = mentoredStudent[0].List
            //CHECKING STUDENT1 ALREADY MENTORED
            if (mentoredStudentArr.includes(student1) === true) {
                msg = student1 + ' ';
                flag = 1;

            }
            else if (mentoredStudentArr.includes(student1) === false) {
                userStud.push(student1)
            }

            //CHECKING STUDENT2 ALREADY MENTORED
            if (mentoredStudentArr.includes(student2) === true) {
                msg = msg + student2 + ' ';
                flag = 2;

            }
            else {
                userStud.push(student2)
            }

        }
        else if (mentoredStudent.length === 0) {
            mentoredStudentArr = []
            userStud.push(student1, student2);
        }

        //READING DATA
        let dataAssignDb;

        try {
            dataAssignDb = await db.collection('assign').find({ _id: mentorCollection[0]._id }).toArray();

        }
        catch (error) {
            dataAssignDb = []
        }

        //  let dataAssignDb=[];

        let data;
        if (dataAssignDb.length) {
            let data1 = dataAssignDb[0][Mentor];
            data = data1.concat(userStud)
        }

        else if (dataAssignDb.length === 0) {
            data = userStud;

        }

        if (userStud.length === 0) {
            msg = msg + 'Already Mentored.Try with others!!';
            res.status(400).json({ message: msg })
            clientInfo.close()
        }
        else if ((userStud.length === 1 && flag === 1) || (userStud.length === 1 && flag === 2)) {

            msg = msg + 'Already Mentored. ' + userStud[0] + ' Assigned to ' + Mentor;
            db.collection('assign').findOneAndUpdate({ _id: mentorCollection[0]._id }, {
                //DATA

                $set: {
                    [Mentor]: data
                }
            }, function (err, data) {

                if (err) throw err;
            })

            let arr = mentoredStudentArr.concat(userStud)

            db.collection('mentoredStudent').findOneAndUpdate({ _id: '1' }, {
                //DATA

                $set: {
                    List: arr
                }
            }, function (err, data) {

                if (err) throw err;
            })


            res.status(200).json({ message: msg })
            clientInfo.close()

        }
        else if (userStud.length === 2) {

            msg = userStud[0] + ' ' + userStud[1] + ' are assigned to ' + Mentor;

            //EXISTED DATA ENTRY 
            if (dataAssignDb.length) {
                db.collection('assign').findOneAndUpdate({ _id: mentorCollection[0]._id }, {
                    //DATA

                    $set: {
                        [Mentor]: data
                    }
                }, function (err, data) {

                    if (err) throw err;
                })
                let arr = mentoredStudentArr.concat(userStud)
                db.collection('mentoredStudent').findOneAndUpdate({ _id: '1' }, {
                    //DATA

                    $set: {
                        List: arr
                    }
                }, function (err, data) {

                    if (err) throw err;

                })

            }
            //FIRST DATA ENTRY 
            else if (dataAssignDb.length === 0) {
                db.collection('assign').insertOne({
                    _id: mentorCollection[0]._id,
                    [Mentor]: data
                }, function (err, data) {
                    if (err) throw err;
                    console.log("students assigned");

                })
                let arr1;


                arr1 = mentoredStudentArr.concat(userStud)

                db.collection('mentoredStudent').findOneAndUpdate({ _id: '1' }, {
                    //DATA


                    $set: {
                        List: arr1
                    }

                }, function (err, data) {

                    if (err) throw err;
                    console.log("students assigned");
                })
            }

        }
        let finalData = await db.collection('assign').find().toArray()
        res.status(200).json(finalData)
        clientInfo.close();

    }
    catch (error) {
        console.log('error last');
    }


})


app.post("/mentorToStudents", async function (req, res) {
    try {
        let mentorId = req.body.mentorId
        

        let clientInfo = await mongoClient.connect(dbUrl);
        let db = clientInfo.db('stud_mentor');
        let data = await db.collection('assign').find({ _id: mentorId }).toArray();
        console.log(data);
        if (data.length) {
            res.send(data)
            clientInfo.close();
        }
        else if (data.length === 0) {
            res.status(404).json({ message: 'Mentor Not Found' })
            clientInfo.close()
        }
    }
    catch (error) {
        console.log(error);
    }


})





app.listen(port, function () {
    console.log("Server Started at 3000!!");
})