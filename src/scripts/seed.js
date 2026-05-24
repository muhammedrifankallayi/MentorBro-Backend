require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const Student = require('../models/student.model');
const Reviewer = require('../models/reviewer.model');
const Batch = require('../models/batch.model');
const Program = require('../models/program.model');
const ProgramTask = require('../models/programTask.model');

const isFresh = process.argv.includes('--fresh');

// ─── Seed Data ────────────────────────────────────────────────────────────────

const programsData = [
    {
        name: 'Full Stack Web Development',
        totalWeeks: 16,
        topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
    },
    {
        name: 'Data Science & Machine Learning',
        totalWeeks: 20,
        topics: ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow'],
    },
    {
        name: 'UI/UX Design',
        totalWeeks: 12,
        topics: ['Figma', 'Wireframing', 'Prototyping', 'User Research'],
    },
];

const batchesData = [
    { name: 'Batch A - Jan 2025', startOn: new Date('2025-01-06'), endedOn: new Date('2025-05-02') },
    { name: 'Batch B - Mar 2025', startOn: new Date('2025-03-03'), endedOn: new Date('2025-07-04') },
    { name: 'Batch C - Jun 2025', startOn: new Date('2025-06-02'), endedOn: new Date('2025-10-03') },
];

const reviewersData = [
    {
        fullName: 'Arjun Menon',
        username: 'arjun_menon',
        password: 'Reviewer@123',
        email: 'arjun.menon@mentorbro.com',
        mobileNo: '9876543210',
        address: 'Kochi, Kerala',
        totalExperience: 5,
        currentCompany: 'TechCorp India',
        googleMeetLink: 'https://meet.google.com/arjun-mentor',
        isVerified: true,
    },
    {
        fullName: 'Priya Nair',
        username: 'priya_nair',
        password: 'Reviewer@123',
        email: 'priya.nair@mentorbro.com',
        mobileNo: '9876543211',
        address: 'Trivandrum, Kerala',
        totalExperience: 7,
        currentCompany: 'Infosys',
        googleMeetLink: 'https://meet.google.com/priya-mentor',
        isVerified: true,
    },
    {
        fullName: 'Rahul Sharma',
        username: 'rahul_sharma',
        password: 'Reviewer@123',
        email: 'rahul.sharma@mentorbro.com',
        mobileNo: '9876543212',
        address: 'Bangalore, Karnataka',
        totalExperience: 4,
        currentCompany: 'Wipro',
        googleMeetLink: 'https://meet.google.com/rahul-mentor',
        isVerified: false,
    },
    {
        fullName: 'Sneha Das',
        username: 'sneha_das',
        password: 'Reviewer@123',
        email: 'sneha.das@mentorbro.com',
        mobileNo: '9876543213',
        address: 'Hyderabad, Telangana',
        totalExperience: 6,
        currentCompany: 'HCL Technologies',
        googleMeetLink: 'https://meet.google.com/sneha-mentor',
        isVerified: true,
    },
    {
        fullName: 'Anil Kumar',
        username: 'anil_kumar',
        password: 'Reviewer@123',
        email: 'anil.kumar@mentorbro.com',
        mobileNo: '9876543214',
        address: 'Chennai, Tamil Nadu',
        totalExperience: 9,
        currentCompany: 'Cognizant',
        googleMeetLink: 'https://meet.google.com/anil-mentor',
        isVerified: true,
    },
];

function buildProgramTasksData(programs) {
    const [fullStack, dataScience, uiux] = programs;
    return [
        // ── Full Stack Web Development ──────────────────────────────────────
        {
            program: fullStack._id, week: 1, name: 'HTML & CSS Fundamentals', cost: 0, re_review_fine_amount: 50,
            tasks: ['Build a personal portfolio page', 'Style with CSS Flexbox and Grid', 'Make it mobile responsive'],
        },
        {
            program: fullStack._id, week: 2, name: 'JavaScript Basics', cost: 0, re_review_fine_amount: 50,
            tasks: ['Variables, data types, and operators', 'Functions and scope', 'DOM manipulation exercises'],
        },
        {
            program: fullStack._id, week: 3, name: 'JavaScript Advanced', cost: 100, re_review_fine_amount: 100,
            tasks: ['Promises and async/await', 'Fetch API and REST calls', 'ES6+ features (destructuring, spread, modules)'],
        },
        {
            program: fullStack._id, week: 4, name: 'React Fundamentals', cost: 100, re_review_fine_amount: 100,
            tasks: ['Create a React app with CRA/Vite', 'Components, props, and state', 'Build a to-do list app'],
        },
        {
            program: fullStack._id, week: 5, name: 'React Hooks & State Management', cost: 150, re_review_fine_amount: 100,
            tasks: ['useEffect for data fetching', 'Context API for global state', 'Custom hooks implementation'],
        },
        {
            program: fullStack._id, week: 6, name: 'Node.js & Express', cost: 150, re_review_fine_amount: 100,
            tasks: ['Set up an Express REST API', 'Middleware and routing', 'CRUD endpoints with in-memory store'],
        },
        {
            program: fullStack._id, week: 7, name: 'MongoDB & Mongoose', cost: 150, re_review_fine_amount: 100,
            tasks: ['Connect Express app to MongoDB', 'Define schemas and models', 'Implement full CRUD with DB'],
        },
        {
            program: fullStack._id, week: 8, name: 'Authentication & Security', cost: 200, re_review_fine_amount: 150,
            tasks: ['JWT authentication flow', 'Password hashing with bcrypt', 'Protected routes and middleware'],
        },
        {
            program: fullStack._id, week: 9, name: 'Full Stack Integration', cost: 200, re_review_fine_amount: 150,
            tasks: ['Connect React frontend to Express backend', 'Handle auth tokens in the frontend', 'Deploy to Vercel + Render'],
        },

        // ── Data Science & Machine Learning ─────────────────────────────────
        {
            program: dataScience._id, week: 1, name: 'Python for Data Science', cost: 0, re_review_fine_amount: 50,
            tasks: ['Python basics: lists, dicts, loops', 'List comprehensions and file I/O', 'Write a data-cleaning script'],
        },
        {
            program: dataScience._id, week: 2, name: 'NumPy & Pandas', cost: 50, re_review_fine_amount: 50,
            tasks: ['Array operations with NumPy', 'DataFrame manipulation with Pandas', 'Analyse a CSV dataset'],
        },
        {
            program: dataScience._id, week: 3, name: 'Data Visualisation', cost: 50, re_review_fine_amount: 50,
            tasks: ['Matplotlib: line, bar, scatter charts', 'Seaborn: heatmaps and distributions', 'EDA report on a real dataset'],
        },
        {
            program: dataScience._id, week: 4, name: 'Statistics & Probability', cost: 100, re_review_fine_amount: 100,
            tasks: ['Descriptive statistics in Python', 'Probability distributions', 'Hypothesis testing with SciPy'],
        },
        {
            program: dataScience._id, week: 5, name: 'Supervised Learning', cost: 100, re_review_fine_amount: 100,
            tasks: ['Linear and logistic regression with Scikit-learn', 'Train/test split and cross-validation', 'Evaluate model with accuracy, F1, ROC'],
        },
        {
            program: dataScience._id, week: 6, name: 'Decision Trees & Ensemble Methods', cost: 150, re_review_fine_amount: 100,
            tasks: ['Decision tree classifier', 'Random Forest and feature importance', 'XGBoost on Kaggle dataset'],
        },
        {
            program: dataScience._id, week: 7, name: 'Unsupervised Learning', cost: 150, re_review_fine_amount: 100,
            tasks: ['K-Means clustering', 'PCA for dimensionality reduction', 'Cluster a customer dataset'],
        },
        {
            program: dataScience._id, week: 8, name: 'Neural Networks & Deep Learning', cost: 200, re_review_fine_amount: 150,
            tasks: ['Build a feedforward NN with Keras', 'Image classification with CNN', 'Fine-tune a pre-trained model'],
        },

        // ── UI/UX Design ─────────────────────────────────────────────────────
        {
            program: uiux._id, week: 1, name: 'Design Thinking & UX Principles', cost: 0, re_review_fine_amount: 50,
            tasks: ['Read and summarise Design Thinking stages', 'Identify UX issues in 3 popular apps', 'Empathy map for a chosen user group'],
        },
        {
            program: uiux._id, week: 2, name: 'User Research Methods', cost: 0, re_review_fine_amount: 50,
            tasks: ['Conduct 3 user interviews', 'Create affinity diagram from notes', 'Define user persona document'],
        },
        {
            program: uiux._id, week: 3, name: 'Wireframing & Information Architecture', cost: 50, re_review_fine_amount: 50,
            tasks: ['Sketch low-fi wireframes for a mobile app', 'Build site map and user flow diagram', 'Present IA to peer for feedback'],
        },
        {
            program: uiux._id, week: 4, name: 'Figma Essentials', cost: 50, re_review_fine_amount: 50,
            tasks: ['Recreate a provided UI screen in Figma', 'Use Auto Layout and components', 'Build a shared design system with styles'],
        },
        {
            program: uiux._id, week: 5, name: 'Prototyping & Micro-interactions', cost: 100, re_review_fine_amount: 100,
            tasks: ['Create interactive prototype with Figma', 'Add micro-interaction animations', 'Share prototype link for review'],
        },
        {
            program: uiux._id, week: 6, name: 'Usability Testing', cost: 100, re_review_fine_amount: 100,
            tasks: ['Plan usability test script', 'Conduct testing with 5 participants', 'Document findings and iterate design'],
        },
        {
            program: uiux._id, week: 7, name: 'Visual Design & Accessibility', cost: 150, re_review_fine_amount: 100,
            tasks: ['Apply typography and colour theory', 'Check WCAG 2.1 AA contrast ratios', 'Audit prototype for accessibility'],
        },
        {
            program: uiux._id, week: 8, name: 'Portfolio Case Study', cost: 150, re_review_fine_amount: 100,
            tasks: ['Document full design process for a project', 'Write problem statement and solutions', 'Publish case study on Behance/portfolio site'],
        },
    ];
}

function buildStudentsData(batches, programs) {
    return [
        {
            name: 'Muhammed Aslam',
            type: 'batch_student',
            email: 'aslam@student.com',
            password: 'Student@123',
            mobileNo: '9000000001',
            address: 'Malappuram, Kerala',
            approvalStatus: 'approved',
            batch: batches[0]._id,
            program: programs[0]._id,
        },
        {
            name: 'Fathima Zahra',
            type: 'batch_student',
            email: 'fathima@student.com',
            password: 'Student@123',
            mobileNo: '9000000002',
            address: 'Kozhikode, Kerala',
            approvalStatus: 'approved',
            batch: batches[0]._id,
            program: programs[0]._id,
        },
        {
            name: 'Abhishek Pillai',
            type: 'batch_student',
            email: 'abhishek@student.com',
            password: 'Student@123',
            mobileNo: '9000000003',
            address: 'Thrissur, Kerala',
            approvalStatus: 'approved',
            batch: batches[1]._id,
            program: programs[1]._id,
        },
        {
            name: 'Nisha Thomas',
            type: 'batch_student',
            email: 'nisha@student.com',
            password: 'Student@123',
            mobileNo: '9000000004',
            address: 'Ernakulam, Kerala',
            approvalStatus: 'pending',
            batch: batches[1]._id,
            program: programs[1]._id,
        },
        {
            name: 'Roshan George',
            type: 'batch_student',
            email: 'roshan@student.com',
            password: 'Student@123',
            mobileNo: '9000000005',
            address: 'Kottayam, Kerala',
            approvalStatus: 'approved',
            batch: batches[2]._id,
            program: programs[2]._id,
        },
        {
            name: 'Anjali Krishnan',
            type: 'batch_student',
            email: 'anjali@student.com',
            password: 'Student@123',
            mobileNo: '9000000006',
            address: 'Palakkad, Kerala',
            approvalStatus: 'approved',
            batch: batches[2]._id,
            program: programs[2]._id,
        },
        {
            name: 'Vishnu Prasad',
            type: 'external_student',
            email: 'vishnu@student.com',
            password: 'Student@123',
            mobileNo: '9000000007',
            address: 'Kannur, Kerala',
            approvalStatus: 'approved',
        },
        {
            name: 'Divya Rajan',
            type: 'external_student',
            email: 'divya@student.com',
            password: 'Student@123',
            mobileNo: '9000000008',
            address: 'Kasaragod, Kerala',
            approvalStatus: 'rejected',
        },
        {
            name: 'Sanju Mohan',
            type: 'batch_student',
            email: 'sanju@student.com',
            password: 'Student@123',
            mobileNo: '9000000009',
            address: 'Wayanad, Kerala',
            approvalStatus: 'approved',
            batch: batches[0]._id,
            program: programs[0]._id,
        },
        {
            name: 'Riya Sebastian',
            type: 'batch_student',
            email: 'riya@student.com',
            password: 'Student@123',
            mobileNo: '9000000010',
            address: 'Idukki, Kerala',
            approvalStatus: 'pending',
            batch: batches[1]._id,
            program: programs[1]._id,
        },
    ];
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        console.log('Connected to MongoDB');

        if (isFresh) {
            await Promise.all([
                Student.deleteMany({}),
                Reviewer.deleteMany({}),
                Batch.deleteMany({}),
                Program.deleteMany({}),
                ProgramTask.deleteMany({}),
            ]);
            console.log('Cleared existing data');
        }

        // Programs
        const programs = await Program.insertMany(programsData);
        console.log(`Seeded ${programs.length} programs`);

        // Program Tasks
        const programTasksData = buildProgramTasksData(programs);
        await ProgramTask.insertMany(programTasksData);
        console.log(`Seeded ${programTasksData.length} program tasks`);

        // Batches
        const batches = await Batch.insertMany(batchesData);
        console.log(`Seeded ${batches.length} batches`);

        // Assign teachingPrograms to reviewers and hash passwords
        const reviewerHash = await bcrypt.hash('Reviewer@123', SALT_ROUNDS);
        const reviewers = reviewersData.map((r, i) => ({
            ...r,
            password: reviewerHash,
            teachingPrograms: [programs[i % programs.length]._id],
        }));
        await Reviewer.insertMany(reviewers);
        console.log(`Seeded ${reviewers.length} reviewers`);

        // Students — hash password then insert
        const studentHash = await bcrypt.hash('Student@123', SALT_ROUNDS);
        const studentsData = buildStudentsData(batches, programs).map((s) => ({
            ...s,
            password: studentHash,
        }));
        await Student.insertMany(studentsData);
        console.log(`Seeded ${studentsData.length} students`);

        console.log('\nSeeding complete.');
        console.log('  Student password : Student@123');
        console.log('  Reviewer password: Reviewer@123');
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
