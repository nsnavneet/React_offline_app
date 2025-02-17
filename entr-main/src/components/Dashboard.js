import React, { useEffect, useState } from 'react';
import { fetchAndStorePatientData } from '../services/patientService';
import { getPatientData, clearDB, savePendingUpload, getPendingUploads, removePendingUpload, savePatientUpload } from '../utils/indexedDB';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [uhid, setUhid] = useState('');
    const [patient, setPatient] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        id: '',
        uhId: '',
        fileName: '',
        fileType: '',
        filePath: '',
        status: '',
        fileSize: 0,
        description: '',
        documentType: '',
        isDeleted: false,
    });

    const [showForm, setShowForm] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (name === 'file' && files.length > 0) {
            const file = files[0];
            setFormData((prevData) => ({
                ...prevData,
                filePath: file.name,
                fileSize: file.size,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: type === 'checkbox' ? checked : value,
                id: name === 'uhId' ? value : prevData.id, // Automatically set id to uhId
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);
        const updatedFormData = {
            ...formData,
            uhId: uhid,
            fileName: formData.filePath,
            fileType: formData.fileType,
            fileSize: formData.fileSize,
            filePath: formData.filePath,
        };

        await savePatientUpload(updatedFormData);

        if (isOnline) {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://15.207.206.215/api/api/PatientDetails/create-documentrecord', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(updatedFormData),
                });

                if (response.ok) {
                    toast.success('Document uploaded successfully!');
                    setShowForm(false);
                } else {
                    await savePendingUpload(updatedFormData);
                    toast.error('Failed to upload document.');
                }
            } catch (error) {
                console.error('Error creating patient record:', error);
                toast.error('Failed to upload document.');
            }
        } else {
            await savePendingUpload(updatedFormData);
            toast.info('You are offline. The record will be uploaded once you are back online.');
        }
    };

    useEffect(() => {
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));

        const syncPatientData = async () => {
            await fetchAndStorePatientData();
            console.log('Patient data fetched and stored.');
        };

        const syncPendingUploads = async () => {
            if (isOnline) {
                const token = localStorage.getItem('token');
                const pendingUploads = await getPendingUploads();
                for (const upload of pendingUploads) {
                    try {
                        const response = await fetch('http://15.207.206.215/api/api/PatientDetails/create-documentrecord', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify(upload),
                        });
                        console.log('Pending upload response:', response.data);
                        await removePendingUpload(upload.id);
                    } catch (error) {
                        console.error('Error uploading pending record:', error);
                    }
                }
            }
        };

        syncPatientData();
        syncPendingUploads();

        return () => {
            window.removeEventListener('online', () => setIsOnline(true));
            window.removeEventListener('offline', () => setIsOnline(false));
        };
    }, [isOnline]);

    const handleSearch = async () => {
        if (!uhid) {
            setError('Please enter a UHID.');
            return;
        }

        const patients = await getPatientData();
        const foundPatient = patients.find((p) => p.uhId === uhid);

        if (foundPatient) {
            setPatient(foundPatient);
            setError('');
        } else {
            setPatient(null);
            setError('Patient not found.');
        }
    };

    const handleLogout = async () => {

        window.location.href = '/';
    };

    return (
        <div>
            <ToastContainer />
            <div className='nav'>
                <h3>Status: {isOnline ? 'Online' : 'Offline'}</h3>
                <button onClick={handleLogout}>Logout</button>
            </div>

            <div className='patientDetails'>
                <div className='header'>
                    <h3>Patient Details</h3>
                </div>
                <div className='actions'>
                    <input
                        type="text"
                        placeholder="Enter UHID"
                        value={uhid}
                        onChange={(e) => setUhid(e.target.value)}
                    />
                    <button onClick={handleSearch}>Search Patient</button>
                    <button onClick={() => setShowForm(!showForm)} disabled={!patient}>
                        {showForm ? 'Close' : 'Upload '}
                    </button>
                </div>
            </div>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {patient && (
                <div className='patientDynamicDetails'>
                    <h3>Patient Details</h3>
                    <p>UHID: <strong>{patient.uhId}</strong></p>
                    <p>Name: <strong>{patient.firstName}</strong></p>
                    <p>Gender: <strong>{patient.gender}</strong></p>
                    <p>Age: <strong>{patient.age}</strong></p>
                    <p>Admission Date: <strong>{patient.dateOfAdmission !== "0001-01-01T00:00:00" ? patient.dateOfAdmission : 'N/A'}</strong></p>
                </div>
            )}

            {showForm && (
                <div className='uploadForm'>
                    <hr></hr>
                    <h3>Upload </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="group">
                            <div>
                                <h4>Form Type</h4>
                                <select name="documentType" onChange={handleChange} value={formData.documentType}>
    <option value="">Select</option>
    <option value="Treatment">Treatment</option>
    <option value="Monitor Screen">Patient Monitor Screen</option>
    <option value="Ventilator Screen">Ventilator Screen</option>
    <option value="Discharge Summary">Discharge Summary</option>
    <option value="Nursing Notes">Nursing Front Sheet</option>
    <option value="Lab Investigation Report">Lab Investigation Report</option>
    <option value="CT Head">CT Head</option>
    <option value="CT Spinal">CT Spinal</option>
    <option value="xray">Chest X-ray</option>
    <option value="MRI">MRI</option>
    <option value="ABG">ABG</option>
    <option value="clinical">Clinical Image</option>
    <option value="White boards">White Boards</option>
    <option value="Other Document">Other Document</option>
</select>
                            </div>
                            <div>
                                <h4>Date</h4>
                                <input type="date" name="date" value={new Date().toISOString().split('T')[0]} readOnly />
                            </div>
                            <div>
                                <h4>Time</h4>
                                <input type="time" name="time" value={new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)} readOnly />
                            </div>
                        </div>

                        <div className="uploadFile">
                            <h4>File</h4>
                            <input type="file" name="file" onChange={handleChange} />
                        </div>
                        <button type="submit">Upload</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Dashboard;