const express = require('express');
const redis = require('redis');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const Papa = require('papaparse');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Ensure the 'uploads' folder exists, create it if it doesn't
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📁 Created uploads folder');
}

// Multer configuration to store files in 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Save in 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Save file with timestamp to avoid name conflicts
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


// Multer for file upload (store in memory)
//const upload = multer({ storage: multer.memoryStorage() });

 //Connect to Redis
const client = redis.createClient({
 url: 'redis://@127.0.0.1:6379',
});

client.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch(err => console.error('❌ Redis connection error:', err));

// Debugging Middleware
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next();
});

// Route to manually add a student
app.post('/students', async (req, res) => {
  const { id, name, surname, sex, course, year, age, address } = req.body;

  // Validate input fields
  if (!id || !name || !surname || !sex || !course || !year || !age || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Set student data in Redis (using object syntax for Redis v4 and above)
    const studentData = { name, surname, sex, course, year, age, address };

    // Save student data in Redis hash
    await client.hSet(`student:${id}`, 'name', studentData.name);
    await client.hSet(`student:${id}`, 'surname', studentData.surname);
    await client.hSet(`student:${id}`, 'sex', studentData.sex);
    await client.hSet(`student:${id}`, 'course', studentData.course);
    await client.hSet(`student:${id}`, 'year', studentData.year);
    await client.hSet(`student:${id}`, 'age', studentData.age);
    await client.hSet(`student:${id}`, 'address', studentData.address);

    // Respond with success message
    res.status(201).json({ message: 'Student saved successfully' });
  } catch (error) {
    console.error('Error saving student:', error);
    res.status(500).json({ message: 'Failed to save student' });
  }
});






// Route to get all students
app.get('/students', async (req, res) => {
  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => {
      const student = await client.hGetAll(key);
      console.log('Student from Redis:', student); // Log the full data
      return { id: key.split(':')[1], ...student };
    }));
    res.json(students);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ message: 'Failed to retrieve students' });
  }
});





// Route to update a student
app.put('/students/:id', async (req, res) => {
  const id = req.params.id;
  const { name, surname, sex, course, year, age, address } = req.body;

  if (!name && !surname && !sex && !course && !year && !age && !address) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }

  try {
    const existingStudent = await client.hGetAll(`student:${id}`);
    if (Object.keys(existingStudent).length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update only provided fields
    if (name) await client.hSet(`student:${id}`, 'name', name);
    if (surname) await client.hSet(`student:${id}`, 'surname', surname);
    if (sex) await client.hSet(`student:${id}`, 'sex', sex);
    if (course) await client.hSet(`student:${id}`, 'course', course);
    if (year) await client.hSet(`student:${id}`, 'year', year);
    if (age) await client.hSet(`student:${id}`, 'age', age);
    if (address) await client.hSet(`student:${id}`, 'address', address);

    res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Route to delete a student
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;

  const studentExists = await client.exists(`student:${id}`);
  if (!studentExists) {
    return res.status(404).json({ message: '⚠️ Student not found' });
  }

  try {
    await client.del(`student:${id}`);
    res.status(200).json({ message: '✅ Student deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});



// Route to search students
app.get('/students/search', async (req, res) => {
  const query = req.query.query?.toLowerCase();
  if (!query) return res.status(400).json({ message: '⚠️ Query is required' });

  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => {
      const student = await client.hGetAll(key);
      return Object.values(student).some(value => value.toLowerCase().includes(query))
        ? { id: key.split(':')[1], ...student }
        : null;
    }));

    const filteredStudents = students.filter(student => student !== null);
    res.json(filteredStudents);
  } catch (error) {
    console.error('❌ Error searching students:', error);
    res.status(500).json({ message: 'Error searching students' });
  }
});


// Route to fetch statistics
app.get('/students/statistics', async (req, res) => {
  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => ({
      ...(await client.hGetAll(key)),
    })));

    const statistics = {
      genderCount: { male: 0, female: 0 },
      courseCount: {},
      yearCount: { "1st Year": 0, "2nd Year": 0, "3rd Year": 0, "4th Year": 0 },
      ageDistribution: {},  
      ageRangeDistribution: {}  
    };

    students.forEach(({ sex, course, year, age }) => {
      // Gender Count
      if (sex) {
        const genderKey = sex.toLowerCase();
        statistics.genderCount[genderKey] = (statistics.genderCount[genderKey] || 0) + 1;
      }

      // Course Count (Normalize input)
      if (course) {
        const normalizedCourse = course.toLowerCase().trim();
        statistics.courseCount[normalizedCourse] = (statistics.courseCount[normalizedCourse] || 0) + 1;
      }

      // Year Count (Normalize input)
      if (year) {
        const normalizedYear = year.toLowerCase();
        if (["1st year", "1st", "first year"].includes(normalizedYear)) {
          statistics.yearCount["1st Year"] += 1;
        } else if (["2nd year", "2nd", "second year"].includes(normalizedYear)) {
          statistics.yearCount["2nd Year"] += 1;
        } else if (["3rd year", "3rd", "third year"].includes(normalizedYear)) {
          statistics.yearCount["3rd Year"] += 1;
        } else if (["4th year", "4th", "fourth year"].includes(normalizedYear)) {
          statistics.yearCount["4th Year"] += 1;
        }
      }

      // Age Range Distribution (Avoid duplicate processing)
      if (age) {
        let ageGroup;
        const numericAge = parseInt(age, 10);

        if (numericAge <= 15) ageGroup = '16 below';
        else if (numericAge >= 16 && numericAge <= 20) ageGroup = '16-20';
        else if (numericAge >= 21 && numericAge <= 25) ageGroup = '21-25';
        else if (numericAge >= 26 && numericAge <= 30) ageGroup = '26-30';
        else ageGroup = '31+';

        statistics.ageRangeDistribution[ageGroup] = (statistics.ageRangeDistribution[ageGroup] || 0) + 1;
      }
    });

    // Transform ageRangeDistribution to an ordered array
    const ageRangeArray = [
      { range: '16 below', count: statistics.ageRangeDistribution['16 below'] || 0 },
      { range: '16-20', count: statistics.ageRangeDistribution['16-20'] || 0 },
      { range: '21-25', count: statistics.ageRangeDistribution['21-25'] || 0 },
      { range: '26-30', count: statistics.ageRangeDistribution['26-30'] || 0 },
      { range: '31+', count: statistics.ageRangeDistribution['31+'] || 0 }
    ];

    // ✅ Send response only once
    res.json({ ...statistics, ageRanges: ageRangeArray });

  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({ message: 'Error retrieving statistics' });
  }
});



app.post('/uploads', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Log the saved file path for debugging
    console.log('📁 Saved File Path:', req.file.path);

    // Read the CSV data
    const csvData = fs.readFileSync(req.file.path, 'utf-8');
    const parsedData = Papa.parse(csvData, { header: true });

    console.log('📊 Parsed CSV Data:', parsedData.data);

    const students = parsedData.data.filter(student => student.id);

    for (const student of students) {
      const normalizedStudent = {
        id: student.id,
        name: student.name || 'unknown',
        surname: student.surname || 'unknown',
        sex: student.sex?.toLowerCase() || 'unknown',
        course: student.course?.toLowerCase().trim() || 'unknown',
        year: student.year?.toLowerCase().trim() || 'unknown',
        age: student.age || 'unknown',
        address: student.address || 'unknown'
      };

      const key = `student:${normalizedStudent.id}`;
      console.log('🔍 Saving to Redis:', key, normalizedStudent);

      for (const [field, value] of Object.entries(normalizedStudent)) {
        await client.hSet(key, field, value);
      }
    }

    res.status(200).json({ message: 'CSV uploaded and saved successfully', students });
  } catch (error) {
    console.error('❌ CSV upload error:', error);
    res.status(500).json({ message: 'Error processing CSV', error });
  }
});





app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
