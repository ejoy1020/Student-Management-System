import React, { useState, useEffect, useRef } from 'react';
import { Button, Row, Col, Container, Form, FormControl } from 'react-bootstrap';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,  ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook

import axios from 'axios';
import 'boxicons/css/boxicons.min.css'
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './admin.css';

const API_URL = 'http://localhost:5000/students';
const STATS_URL = 'http://localhost:5000/students/statistics';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];



function Admin() {
  const navigate = useNavigate(); // Initialize the navigate function
  const [activeMenu, setActiveMenu] = useState('Dashboard'); // Track active menu
  const [logoutConfirmation, setLogoutConfirmation] = useState(false); // State for showing the modal
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', surname: '', sex: '', course: '', year: '', age: '', address: '' });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  

  // Fetch all students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      // Sort students by ID in ascending order
      const sortedStudents = response.data.sort((a, b) => a.id - b.id);
      setStudents(sortedStudents);    
      setStudents(response.data);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await axios.get(STATS_URL);
      console.log("📊 Statistics Response:", response.data); // Debugging
      if (response.data && Object.keys(response.data).length > 0) {
        setStatistics(response.data);
      } else {
        console.warn("⚠️ Statistics API returned empty data!");
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    }
  };

   
  

  

  useEffect(() => {
    fetchStudents();
    fetchStatistics();
  }, []);

  useEffect(() => {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("content");
  
    const toggleSidebar = () => {
      if (sidebar) {
        sidebar.classList.toggle("collapsed");
      }
  
      if (content) {
        if (sidebar.classList.contains("collapsed")) {
          content.style.width = "calc(100% - 80px)";
          content.style.left = "80px";
        } else {
          content.style.width = "calc(100% - 280px)";
          content.style.left = "280px";
        }
      }
    };
  
    if (menuToggle) {
      menuToggle.addEventListener("click", toggleSidebar);
    }
  
    const handleScroll = () => {
      const dashboardSection = document.querySelector(".head-title");
      const studentListSection = document.querySelector(".table-data");
      const statisticsSection = document.getElementById("statistics");
  
      let newActiveMenu = "Dashboard"; // Default to Dashboard
  
      if (statisticsSection && statisticsSection.getBoundingClientRect().top < window.innerHeight / 2) {
        newActiveMenu = "Analytics";
      } else if (studentListSection && studentListSection.getBoundingClientRect().top < window.innerHeight / 2) {
        newActiveMenu = "Student Lists";
      }
  
      setActiveMenu(newActiveMenu);
    };
  
    window.addEventListener("scroll", handleScroll);
  
    return () => {
      if (menuToggle) {
        menuToggle.removeEventListener("click", toggleSidebar);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  const handleScrollToSection = (section) => {
    const target = section === 'statistics' 
      ? document.getElementById('statistics')  // Use ID for statistics
      : document.querySelector(`.${section}`); // Use class for others
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
        toast.error('Please select a CSV file first');
        return;
    }

    console.log("📤 Reading CSV file:", file.name);

    const formData = new FormData();
    formData.append('csvFile', file); // Backend expects 'csvFile' as the field name

    try {
        console.log("📤 Uploading CSV file:", file.name);

        // Send the file to the backend
        const response = await axios.post('http://localhost:5000/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log("✅ Upload response:", response.data);

        if (response.data.message === "CSV uploaded successfully") {
            toast.success('CSV uploaded successfully!');
        } else {
          toast.success('CSV uploaded successfully!');
            //toast.warn('Upload succeeded, but check data integrity.');
        }

        // Refresh student data and statistics
        await fetchStudents();
        await fetchStatistics();
       

    } catch (error) {
        console.error('❌ Error uploading CSV:', error.response?.data || error);

        // Handle errors properly
        if (error.response) {
            toast.error(`Upload failed: ${error.response.data.message || 'Unknown server error'}`);
        } else {
            toast.error('Server unreachable. Check connection.');
        }
    }
};

  


 // Handle form input changes
 const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

   // Add new student
   const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      toast.success('Student added successfully!');
      fetchStudents();
      fetchStatistics();
      setFormData({ id: '', name: '', surname: '', sex: '', course: '', year: '', age: '', address: '' });
    } catch (error) {
      toast.error('Error adding student!');
    }
  };

  // Update existing student
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${formData.id}`, formData);
      toast.success('Student updated successfully!');
      fetchStudents();
      fetchStatistics();
      setFormData({ id: '', name: '', surname: '', sex: '', course: '', year: '', age: '', address: '' });
      setIsEditing(false);
    } catch (error) {
      toast.error('Error updating student!');
    }
  };

  // Delete student
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Student deleted!');
      fetchStudents();
      fetchStatistics();
    } catch (error) {
      toast.error('Error deleting student!');
    }
  };

  // Populate form for updating student
  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
  };

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    Object.values(student).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implement any logic needed when the user presses enter or clicks the button.
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = (event) => {
    event.preventDefault();
    setLogoutConfirmation(true); // Show the modal when the user clicks logout
  };

  const confirmLogout = () => {
    localStorage.removeItem("authToken"); // Remove authentication token
    sessionStorage.removeItem("authToken");
    console.log('Logged out');
    navigate("/"); // Navigate to the login page
  };

  const cancelLogout = () => {
    setLogoutConfirmation(false); // Hide the modal if the user cancels
  };

  return (

    <div className='dashboard'>
       <section id="sidebar">
        <a href="#" className="brand">
          <i className="bx bxs-user-account"></i>
          <span className="text">Student Management</span>
        </a>
    
        <ul className="side-menu top">
          <li className={activeMenu === 'Dashboard' ? 'active' : ''}>
            <a onClick={() => { setActiveMenu('Dashboard'); handleScrollToSection('box-info'); }}>
              <i className="bx bxs-dashboard"></i>
              <span className="text">Dashboard</span>
            </a>
          </li>
          <li className={activeMenu === 'Student Lists' ? 'active' : ''}>
            <a  onClick={() => { setActiveMenu('Student Lists'); handleScrollToSection('table-data'); }}>
              <i className="bx bxs-group"></i>
              <span className="text">Student Lists</span>
            </a>
          </li>
          <li className={activeMenu === 'Analytics' ? 'active' : ''}>
            <a onClick={() => { setActiveMenu('Analytics'); handleScrollToSection('statistics'); }}>
              <i className="bx bxs-analyse"></i>
              <span className="text">Analytics</span>
            </a>
          </li>
          <li>
            <a href="#" className="logout" onClick={handleLogout}>
              <i className="bx bxs-log-out"></i>
              <span className="text">Logout</span>
            </a>
          </li>
        </ul>
      </section>

      {logoutConfirmation && (
  <div className="logout-modal">
    <p>Are you sure you want to logout?</p>
    <button onClick={confirmLogout}>Yes</button>
    <button onClick={cancelLogout}>Cancel</button>
  </div>
)}




      <section id="content">
        <nav>
          <i id="menu-toggle" className="bx bx-menu"></i>
            <a href="#">Students Dashbord</a>
              
    
            
            <a href='#' className='profile'>
                {/*<img src={userImage} alt='user' />*/}
            </a>
        </nav>

                {/* Dashboard Section */}
                <main>
                    <div className="head-title">
                        <div className="left">
                            <h1>Dashboard</h1>
                            <ul className="breadcrumb">
                                <li>
                                    <a href="#">Dashboard</a>
                                </li>
                                <li><i className="bx bx-chevron-right"></i></li>
                                <li className="active">
                                    <a href="#">Home</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <ul className="box-info">
                        <li>
                            <i className="bx bxs-user-detail"></i>
                            <span className="text">
                                <h3>{Object.values(statistics?.courseCount || {}).reduce((a, b) => a + b, 0)}</h3>
                                <p>Total Students</p>
                            </span>
                        </li>
                        <li>
                            <i className="bx bx-male-sign"></i>
                            <span className="text">
                                <h3>{statistics?.genderCount?.male || 0}</h3>
                                <p>Male Students</p>
                            </span>
                        </li>
                        <li>
                            <i className="bx bx-female-sign"></i>
                            <span className="text">
                                <h3>{statistics?.genderCount?.female || 0}</h3>
                                <p>Female Students</p>
                            </span>
                        </li>
                        <li>
                            <i className="bx bxs-book-content"></i>
                            <span className="text">
                                <h3>{Object.keys(statistics?.courseCount || {}).length}</h3>
                                <p>Total Course</p>
                            </span>
                        </li>
                        <li>
    <i className="bx bx-user"></i>
    <span className="text">
        <h3>{statistics?.yearCount["1st Year"] || 0}</h3>
        <p>1st Year Students</p>
    </span>
</li>
<li>
    <i className="bx bx-user-plus"></i>
    <span className="text">
        <h3>{statistics?.yearCount["2nd Year"] || 0}</h3>
        <p>2nd Year Students</p>
    </span>
</li>
<li>
    <i className="bx bx-user-plus"></i>
    <span className="text">
        <h3>{statistics?.yearCount["3rd Year"] || 0}</h3>
        <p>3rd Year Students</p>
    </span>
</li>
<li>
    <i className="bx bx-user-check"></i>
    <span className="text">
        <h3>{statistics?.yearCount["4th Year"] || 0}</h3>
        <p>4th Year Students</p>
    </span>
</li>

                    </ul>

{/* Student List Section */}

                    <div className='table-data'>
                        <div className='order'>
                            <div className='header'>
                                <h3>Student List</h3>
                                {/* Search Bar */}
                                <Form inline onSubmit={handleSearchSubmit} className="d-flex search-bar-container">
                                    <FormControl
                                       type="text"
                                       placeholder="Search students..."
                                       value={searchQuery}
                                       onChange={handleSearchChange}
                                       className="search-input"
                                       />
                                </Form>

                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Surname</th>
                                        <th>Sex</th>
                                        <th>Course</th>
                                        <th>Year</th>
                                        <th>Age</th>
                                        <th>Address</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    {/* Input Form inside Table */}
                                    <tr>
                                      <td><input type="text" name="id" value={formData.id} onChange={handleChange} required style={{ width: '80%' }} /></td>
                                      <td><input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '80%' }} /></td>
                                      <td><input type="text" name="surname" value={formData.surname} onChange={handleChange} required style={{ width: '80%' }} /></td>
                                      <td>
                                        <select name="sex" value={formData.sex} onChange={handleChange} required style={{ width: '80%' }}>
                                          <option value="">Select</option>
                                          <option value="female">Female</option>
                                          <option value="male">Male</option>
                                        </select>
                                      </td>
                                      <td><input type="text" name="course" value={formData.course} onChange={handleChange} required style={{ width: '80%' }} /></td>
                                      <td>                                 
  <select name="year" value={formData.year} onChange={handleChange} required style={{ width: '80%' }}>
    <option value="">Select Year</option>
    <option value="1st Year">1st Year</option>
    <option value="2nd Year">2nd Year</option>
    <option value="3rd Year">3rd Year</option>
    <option value="4th Year">4th Year</option>
  </select>
</td>
                                      <td><input type="number" name="age" value={formData.age} onChange={handleChange} required style={{ width: '80%' }} /></td>
                                      <td><input type="text" name="address" value={formData.address} onChange={handleChange} required style={{ width: '80%' }} /></td>

{/* Add and Upload Buttons in Table */}
<td>
  {!isEditing ? (
    <Button size="sm" variant="success" onClick={handleAddSubmit}>
      Add
    </Button>
  ) : (
    <Button size="sm" variant="warning" onClick={handleEditSubmit}>
      Update
    </Button>
  )}
</td>
<td>
{/* File Input */}
<input
  type="file"
  accept=".csv"
  ref={fileInputRef}
  style={{ display: 'none' }}
  onChange={handleFileUpload}
/>
  {/* Upload Button */}
  <Button
    size="sm"
    variant="info"
    onClick={() => fileInputRef.current.click()}
  >
    Upload
  </Button>
</td>

</tr>
                                    
                                                {/* Display Students */}
                                                {filteredStudents.map((student) => (
                                                  <tr key={student.id}>
                                                    <td>{student.id}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.surname}</td>
                                                    <td>{student.sex}</td>
                                                    <td>{student.course}</td>
                                                    <td>{student.year}</td>
                                                    <td>{student.age}</td>
                                                    <td>{student.address}</td>
                                                    <td>
                                                      <Button size="sm" variant="warning" onClick={() => handleEdit(student)}>Edit</Button>
                                                    </td>
                                                    <td>
                                                      <Button size="sm" variant="danger" onClick={() => handleDelete(student.id)}>Delete</Button>
                                                    </td>
                                                  </tr>
                                                ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </main>

                
                </section>

                
                <section id="content">
  {/* Other content like dashboard and student list */}

  <div id="statistics">
    <main>
      <Container fluid className="statistics-container">
        <h2>Statistics</h2>
        
        {/* Charts Section */}
        <Row className="mt-4">
          {/* First Row with 2 graphs */}
          <Col md={6}>
            <h3>Gender Distribution</h3>
            <PieChart width={300} height={300}>
              <Pie 
                data={Object.entries(statistics?.genderCount || {}).map(([name, value]) => ({ name, value }))} 
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                label
              >
                {Object.entries(statistics?.genderCount || {}).map((_, index) => (
                  <Cell key={`cell-gender-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </Col>

          <Col md={6}>
            <h3>Students per Course</h3>
            <BarChart
              width={300}
              height={300}
              data={Object.entries(statistics?.courseCount || {}).map(([name, value]) => ({ name, value }))}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {Object.entries(statistics?.courseCount || {}).map((_, index) => (
                  <Cell key={`cell-course-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </Col>
        </Row>
        
        {/* Second Row with the 3rd Graph (Age Range Distribution) */}
        <Row className="mt-4">
          <Col md={12}>
            <h3>Age Range Distribution</h3>
            <div className="age-distribution-graph">
              {Array.isArray(statistics?.ageRanges) && statistics.ageRanges.length > 0 && (
                <ResponsiveContainer width="30%" height={300}>
                  <BarChart data={statistics.ageRanges}>
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count">
                      {statistics.ageRanges.map((entry) => (
                        <Cell
                          key={`cell-age-${entry.range}`}
                          fill={
                            entry.range === '16 below' ? '#8884d8' :      // Light Purple
                            entry.range === '16-20' ? '#82ca9d' :         // Light Green
                            entry.range === '21-30' ? '#ffc658' :         // Light Yellow
                            '#ff8042'                                    // Light Orange for 31+
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  </div>
</section>


            
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
    </div>
  );
}

export default Admin;
