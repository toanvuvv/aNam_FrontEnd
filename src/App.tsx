import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import Layout from './components/Layout';
import UserManagement from './pages/UserManagement';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<UserManagement />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;

