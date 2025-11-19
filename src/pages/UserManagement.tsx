import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
  Avatar,
  Tabs,
  Tag,
  Tooltip,
  Switch,
  Pagination,
  Alert,
  Checkbox,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, LinkOutlined, ExperimentOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined, RocketOutlined, InfoCircleOutlined, DownOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, ShoppingCartOutlined, ShoppingOutlined, DollarOutlined } from '@ant-design/icons';
import { userApi, productLinkApi, sampleProductApi } from '../services/api';
import { canUseChromeRuntime, getStoredExtensionId, pingExtension, requestCartPairs, saveExtensionId } from '../services/extension';
import type { User, CreateUserDto, ProductLink, SampleProduct, SessionInfo } from '../types';
import PrepareProductsModal from '../components/UserManagement/PrepareProductsModal';
import PreparationDetailModal from '../components/UserManagement/PreparationDetailModal';
import RealCartDetailModal from '../components/UserManagement/RealCartDetailModal';
import RealCartActionLog from '../components/UserManagement/RealCartActionLog';
import type { LogEntry } from '../components/UserManagement/RealCartActionLog';

const { Title } = Typography;
const { TextArea } = Input;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  
  // States cho quản lý link và sản phẩm mẫu
  const [addLinkModalVisible, setAddLinkModalVisible] = useState(false);
  const [addSampleModalVisible, setAddSampleModalVisible] = useState(false);
  const [selectedUserForLink, setSelectedUserForLink] = useState<User | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  
  // States cho hiển thị chi tiết
  const [showDetailUserId, setShowDetailUserId] = useState<string | null>(null);
  const [userProductLinks, setUserProductLinks] = useState<ProductLink[]>([]);
  const [userSampleProducts, setUserSampleProducts] = useState<SampleProduct[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // States cho modal chỉnh sửa
  const [editLinkModalVisible, setEditLinkModalVisible] = useState(false);
  const [editSampleModalVisible, setEditSampleModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState<ProductLink | null>(null);
  const [editingSample, setEditingSample] = useState<SampleProduct | null>(null);
  const [linkForm] = Form.useForm();
  const [sampleForm] = Form.useForm();
  
  // States cho chọn hàng loạt
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);

  // State cho filter link (mặc định: hiển thị link sẵn sàng - chưa gán)
  const [showReadyLinks, setShowReadyLinks] = useState<boolean>(true);

  // States cho phân trang
  const [linkPage, setLinkPage] = useState<number>(1);
  const [linkPageSize, setLinkPageSize] = useState<number>(10);
  const [samplePage, setSamplePage] = useState<number>(1);
  const [samplePageSize, setSamplePageSize] = useState<number>(10);

  // States cho modal chuẩn bị sản phẩm
  const [prepareModalVisible, setPrepareModalVisible] = useState(false);
  const [userForPreparation, setUserForPreparation] = useState<User | null>(null);

  // States cho modal chi tiết tóm tắt chuẩn bị
  const [preparationDetailModalVisible, setPreparationDetailModalVisible] = useState(false);
  const [selectedPreparationUser, setSelectedPreparationUser] = useState<User | null>(null);

  // States cho real cart
  const [selectedUserForActions, setSelectedUserForActions] = useState<string>('');
  const [realCartDetailModalVisible, setRealCartDetailModalVisible] = useState(false);
  const [selectedRealCartUser, setSelectedRealCartUser] = useState<User | null>(null);
  const [realCartActionModalVisible, setRealCartActionModalVisible] = useState(false);
  const [realCartActionLogs, setRealCartActionLogs] = useState<LogEntry[]>([]);
  const [realCartActionLoading, setRealCartActionLoading] = useState(false);
  const [realCartActionProgress, setRealCartActionProgress] = useState<{ current: number; total: number; label: string } | undefined>(undefined);

  // States cho live status
  const [liveStatusMap, setLiveStatusMap] = useState<Record<string, { isLive: boolean; sessionId?: number; sessionTitle?: string; loading?: boolean }>>({});
  
  // States cho cookie status checking
  const [cookieCheckingMap, setCookieCheckingMap] = useState<Record<string, boolean>>({});

  // States cho session list
  const [sessionListMap, setSessionListMap] = useState<Record<string, SessionInfo[]>>({});
  const [sessionListLoadingMap, setSessionListLoadingMap] = useState<Record<string, boolean>>({});

  // States cho modal quản lý giỏ hàng và chuẩn bị sản phẩm
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [extensionIdInput, setExtensionIdInput] = useState('');
  const [extensionStatus, setExtensionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [extensionChecking, setExtensionChecking] = useState(false);
  const chromeRuntimeAvailable = typeof window !== 'undefined' && canUseChromeRuntime();
  const extensionStatusDescription = {
    unknown: 'Chưa kiểm tra kết nối extension',
    connected: 'Extension đã sẵn sàng để nhận lệnh',
    error: 'Không thể kết nối extension. Vui lòng kiểm tra ID và đảm bảo extension đang chạy',
  } as const;

  const verifyExtension = async (id: string, showToast = true) => {
    const trimmedId = id.trim();
    if (!trimmedId) {
      setExtensionStatus('error');
      if (showToast) {
        message.error('Vui lòng nhập Extension ID hợp lệ');
      }
      throw new Error('Extension ID rỗng');
    }

    if (!canUseChromeRuntime()) {
      setExtensionStatus('error');
      if (showToast) {
        message.error('Trình duyệt không hỗ trợ Chrome Extension API');
      }
      throw new Error('chrome.runtime không khả dụng');
    }

    setExtensionChecking(true);
    try {
      await pingExtension(trimmedId);
      saveExtensionId(trimmedId);
      setExtensionIdInput(trimmedId);
      setExtensionStatus('connected');
      if (showToast) {
        message.success('Extension đã sẵn sàng');
      }
    } catch (error: any) {
      setExtensionStatus('error');
      if (showToast) {
        message.error(`Không thể kết nối extension: ${error.message || error}`);
      }
      throw error;
    } finally {
      setExtensionChecking(false);
    }
  };

  const handleSaveExtensionId = async () => {
    try {
      await verifyExtension(extensionIdInput, true);
    } catch {
      // Đã hiển thị message trong verifyExtension
    }
  };

  const handleSaveOnlyExtensionId = () => {
    const trimmedId = extensionIdInput.trim();
    if (!trimmedId) {
      message.warning('Vui lòng nhập Extension ID');
      return;
    }
    saveExtensionId(trimmedId);
    message.success('Đã lưu Extension ID vào localStorage');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const storedId = getStoredExtensionId();
    if (storedId) {
      setExtensionIdInput(storedId);
      if (canUseChromeRuntime()) {
        verifyExtension(storedId, false).catch(() => {
          // ignore auto verify errors
        });
      }
    }
  }, []);

  // Check live status và lấy session list cho tất cả users khi load
  useEffect(() => {
    if (users.length > 0) {
      checkAllLiveStatus();
      fetchAllSessionLists();
    }
  }, [users]);

  const checkAllLiveStatus = async () => {
    // Check live status cho từng user (parallel)
    const promises = users.map(async (user) => {
      const userId = user.id || user._id;
      
      // Set loading state
      setLiveStatusMap(prev => ({
        ...prev,
        [userId]: { ...prev[userId], loading: true },
      }));

      try {
        const response = await userApi.checkLiveStatus(userId);
        setLiveStatusMap(prev => ({
          ...prev,
          [userId]: {
            isLive: response.data.isLive,
            sessionId: response.data.sessionId,
            sessionTitle: response.data.sessionTitle,
            loading: false,
          },
        }));
      } catch (error) {
        // Nếu lỗi, coi như không live
        setLiveStatusMap(prev => ({
          ...prev,
          [userId]: {
            isLive: false,
            loading: false,
          },
        }));
      }
    });

    await Promise.all(promises);
  };

  const fetchAllSessionLists = async () => {
    // Lấy session list cho từng user (parallel)
    const promises = users.map(async (user) => {
      const userId = user.id || user._id;
      
      setSessionListLoadingMap(prev => ({ ...prev, [userId]: true }));

      try {
        const response = await userApi.getSessionList(userId);
        setSessionListMap(prev => ({
          ...prev,
          [userId]: response.data.sessions || [],
        }));
      } catch (error) {
        // Nếu lỗi, để mảng rỗng
        setSessionListMap(prev => ({
          ...prev,
          [userId]: [],
        }));
      } finally {
        setSessionListLoadingMap(prev => ({ ...prev, [userId]: false }));
      }
    });

    await Promise.all(promises);
  };

  // Handler để check cookies
  const handleCheckCookies = async (user: User) => {
    const userId = user.id || user._id;
    
    setCookieCheckingMap(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await userApi.checkCookies(userId);
      const result = response.data;
      
      message.success(result.message || `Cookies ${result.status === 'valid' ? 'hợp lệ' : 'không hợp lệ'}`);
      
      // Refresh user list để cập nhật cookieStatus
      await fetchUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi kiểm tra cookies';
      message.error(errorMessage);
    } finally {
      setCookieCheckingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Parse Shopee URL để lấy shopId và itemId
  const parseShopeeUrl = (url: string): { shopId: string | null; itemId: string | null } => {
    // Parse URL like: https://shopee.vn/product/1506174776/27240240844
    const regex = /\/product\/(\d+)\/(\d+)/;
    const match = url.trim().match(regex);
    
    if (!match) {
      return { shopId: null, itemId: null };
    }
    
    return {
      shopId: match[1],
      itemId: match[2],
    };
  };

  // Xử lý thêm nhiều link kho (sử dụng batch API để tối ưu)
  const handleAddLinks = async () => {
    if (!selectedUserForLink) {
      message.error('Vui lòng chọn user');
      return;
    }

    const rawLinks = linkInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (rawLinks.length === 0) {
      message.error('Vui lòng nhập ít nhất một link');
      return;
    }

    try {
      setLoading(true);
      
      // Validate và filter các link hợp lệ
      const validLinks: Array<{ fullUrl: string }> = [];
      const invalidLinks: string[] = [];
      
      for (const url of rawLinks) {
        const parsed = parseShopeeUrl(url);
        if (!parsed.shopId || !parsed.itemId) {
          invalidLinks.push(url);
        } else {
          validLinks.push({ fullUrl: url });
        }
      }

      // Hiển thị cảnh báo cho các link không hợp lệ
      if (invalidLinks.length > 0) {
        if (invalidLinks.length <= 5) {
          invalidLinks.forEach(url => message.warning(`Link không hợp lệ (bỏ qua): ${url}`, 3));
        } else {
          message.warning(`${invalidLinks.length} link không hợp lệ đã được bỏ qua`, 5);
        }
      }

      if (validLinks.length === 0) {
        message.error('Không có link hợp lệ nào để thêm');
        setLoading(false);
        return;
      }

      // Sử dụng batch API để thêm tất cả link cùng lúc
      const batchResult = await productLinkApi.batchCreate({
        userId: selectedUserForLink.id || selectedUserForLink._id,
        links: validLinks,
      });

      const { created, skipped } = batchResult.data;

      if (created > 0) {
        message.success(`Đã thêm thành công ${created} link${created > 1 ? 's' : ''} vào kho`);
      }
      
      if (skipped > 0) {
        message.info(`${skipped} link${skipped > 1 ? 's' : ''} đã tồn tại trong kho (đã bỏ qua)`);
      }

      if (created === 0 && skipped === validLinks.length) {
        message.warning('Tất cả các link đã tồn tại trong kho link hoặc kho sản phẩm mẫu');
      }

      setAddLinkModalVisible(false);
      setLinkInput('');
      fetchUsers(); // Refresh danh sách
      if (showDetailUserId && selectedUserForLink) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error: any) {
      console.error('Lỗi khi thêm links:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi thêm links';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thêm nhiều sản phẩm mẫu
  const handleAddSamples = async () => {
    if (!selectedUserForLink) {
      message.error('Vui lòng chọn user');
      return;
    }

    const links = sampleInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (links.length === 0) {
      message.error('Vui lòng nhập ít nhất một link');
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const url of links) {
        try {
          const parsed = parseShopeeUrl(url);
          if (!parsed.shopId || !parsed.itemId) {
            message.warning(`Link không hợp lệ (bỏ qua): ${url}`);
            errorCount++;
            continue;
          }

          await sampleProductApi.create({
            sampleLink: url,
            userId: selectedUserForLink.id || selectedUserForLink._id,
          });
          successCount++;
        } catch (error: any) {
          console.error(`Lỗi khi thêm sample link ${url}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Đã thêm thành công ${successCount} sản phẩm mẫu`);
      }
      if (errorCount > 0) {
        message.warning(`${errorCount} link${errorCount > 1 ? 's' : ''} không thể thêm`);
      }

      setAddSampleModalVisible(false);
      setSampleInput('');
      fetchUsers(); // Refresh danh sách
      if (showDetailUserId && selectedUserForLink) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error) {
      message.error('Lỗi khi thêm sản phẩm mẫu');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal thêm link
  const handleOpenAddLinkModal = (user: User) => {
    setSelectedUserForLink(user);
    setLinkInput('');
    setAddLinkModalVisible(true);
  };

  // Mở modal thêm sản phẩm mẫu
  const handleOpenAddSampleModal = (user: User) => {
    setSelectedUserForLink(user);
    setSampleInput('');
    setAddSampleModalVisible(true);
  };

  // Toggle hiển thị chi tiết
  const handleToggleDetails = async (user: User) => {
    const userId = user.id || user._id;
    
    if (showDetailUserId === userId) {
      // Đang hiển thị, ẩn đi
      setShowDetailUserId(null);
      setUserProductLinks([]);
      setUserSampleProducts([]);
    } else {
      // Chưa hiển thị, load và hiển thị
      setShowDetailUserId(userId);
      setSelectedLinkIds([]);
      setSelectedSampleIds([]);
      // Reset pagination về trang 1
      setLinkPage(1);
      setSamplePage(1);
      await fetchUserDetails(userId);
    }
  };

  // Fetch chi tiết link và sample của user
  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const [linksResponse, samplesResponse] = await Promise.all([
        productLinkApi.getAll(userId),
        sampleProductApi.getAll(userId),
      ]);
      setUserProductLinks(linksResponse.data || []);
      setUserSampleProducts(samplesResponse.data || []);
    } catch (error) {
      message.error('Lỗi khi tải chi tiết');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Tạo URL từ shopId và itemId
  const buildShopeeUrl = (shopId: string, itemId: string): string => {
    return `https://shopee.vn/product/${shopId}/${itemId}`;
  };

  // Copy URL vào clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('Đã copy URL');
  };

  // Xóa link
  const handleDeleteLink = async (id: string) => {
    try {
      await productLinkApi.delete(id);
      message.success('Xóa link thành công');
      setSelectedLinkIds(prev => prev.filter(linkId => linkId !== id));
      if (showDetailUserId) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi xóa link';
      message.error(errorMessage);
    }
  };

  // Xóa sample
  const handleDeleteSample = async (id: string) => {
    try {
      await sampleProductApi.delete(id);
      message.success('Xóa sản phẩm mẫu thành công');
      setSelectedSampleIds(prev => prev.filter(sampleId => sampleId !== id));
      if (showDetailUserId) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi xóa sản phẩm mẫu';
      message.error(errorMessage);
    }
  };

  // Xóa hàng loạt links
  const handleDeleteLinksBatch = async () => {
    if (selectedLinkIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một link để xóa');
      return;
    }

    try {
      setLoadingDetails(true);
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedLinkIds) {
        try {
          await productLinkApi.delete(id);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Đã xóa thành công ${successCount} link${successCount > 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        message.warning(`${errorCount} link${errorCount > 1 ? 's' : ''} không thể xóa`);
      }

      setSelectedLinkIds([]);
      if (showDetailUserId) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error) {
      message.error('Lỗi khi xóa hàng loạt links');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Xóa hàng loạt samples
  const handleDeleteSamplesBatch = async () => {
    if (selectedSampleIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm mẫu để xóa');
      return;
    }

    try {
      setLoadingDetails(true);
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedSampleIds) {
        try {
          await sampleProductApi.delete(id);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        message.success(`Đã xóa thành công ${successCount} sản phẩm mẫu${successCount > 1 ? '' : ''}`);
      }
      if (errorCount > 0) {
        message.warning(`${errorCount} sản phẩm mẫu không thể xóa`);
      }

      setSelectedSampleIds([]);
      if (showDetailUserId) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error) {
      message.error('Lỗi khi xóa hàng loạt sản phẩm mẫu');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle chọn link
  const handleToggleLinkSelection = (id: string) => {
    setSelectedLinkIds(prev => 
      prev.includes(id) 
        ? prev.filter(linkId => linkId !== id)
        : [...prev, id]
    );
  };

  // Toggle chọn sample
  const handleToggleSampleSelection = (id: string) => {
    setSelectedSampleIds(prev => 
      prev.includes(id) 
        ? prev.filter(sampleId => sampleId !== id)
        : [...prev, id]
    );
  };


  // Mở modal chỉnh sửa link
  const handleEditLink = (link: ProductLink) => {
    setEditingLink(link);
    linkForm.setFieldsValue({
      fullUrl: link.fullUrl,
      description: link.description,
    });
    setEditLinkModalVisible(true);
  };

  // Mở modal chỉnh sửa sample
  const handleEditSample = (sample: SampleProduct) => {
    setEditingSample(sample);
    sampleForm.setFieldsValue({
      sampleLink: sample.sampleLink,
      description: sample.description,
    });
    setEditSampleModalVisible(true);
  };

  // Submit chỉnh sửa link
  const handleSubmitEditLink = async (values: any) => {
    if (!editingLink) return;
    
    try {
      const id = editingLink.id || editingLink._id;
      await productLinkApi.update(id, values);
      message.success('Cập nhật link thành công');
      setEditLinkModalVisible(false);
      setEditingLink(null);
      linkForm.resetFields();
      if (showDetailUserId) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật link');
    }
  };

  // Submit chỉnh sửa sample
  const handleSubmitEditSample = async (values: any) => {
    if (!editingSample) return;
    
    try {
      const id = editingSample.id || editingSample._id;
      await sampleProductApi.update(id, values);
      message.success('Cập nhật sản phẩm mẫu thành công');
      setEditSampleModalVisible(false);
      setEditingSample(null);
      sampleForm.resetFields();
      if (showDetailUserId) {
        await fetchUserDetails(showDetailUserId);
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật sản phẩm mẫu');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setJsonInput('');
    setActiveTab('1'); // Reset về tab đầu tiên khi mở modal mới
    setModalVisible(true);
  };

  const handleParseJson = () => {
    try {
      console.log('📥 Đang parse JSON...');
      const data = JSON.parse(jsonInput);
      console.log('📋 Dữ liệu đã parse:', data);
      
      if (!data.user || !data.cookies) {
        message.error('Dữ liệu không hợp lệ. Cần có user và cookies');
        return;
      }

      // Parse dữ liệu từ extension
      const formData = {
        username: data.user.name || data.user.uid,
        avatar: data.user.avatar,
        cookies: data.cookies,
        cookiesFull: data.cookiesFull,
        userData: data.user,
        name: data.user.name || '',
        cartCapacity: 100,
      };

      console.log('✅ Dữ liệu đã được điền vào form:', formData);
      form.setFieldsValue(formData);
      message.success('Đã parse dữ liệu thành công! Đang chuyển sang form để tạo user...');
      // Tự động chuyển sang tab Form thủ công sau khi parse thành công
      setActiveTab('2');
    } catch (error) {
      console.error('❌ Lỗi khi parse JSON:', error);
      message.error('Lỗi khi parse JSON. Vui lòng kiểm tra lại định dạng');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id);
      message.success('Xóa user thành công');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi xóa user');
    }
  };

  const handleOpenPrepareModal = (user: User) => {
    setUserForPreparation(user);
    setPrepareModalVisible(true);
  };

  const handleOpenPreparationDetailModal = (user: User) => {
    setSelectedPreparationUser(user);
    setPreparationDetailModalVisible(true);
  };

  const handleOpenRealCartDetailModal = (user: User) => {
    setSelectedRealCartUser(user);
    setRealCartDetailModalVisible(true);
  };

  const selectedUserForActionsObj = users.find(u => (u.id || u._id) === selectedUserForActions);
  const selectedUserCartAssignment = selectedUserForActionsObj?.cartAssignment ? JSON.parse(selectedUserForActionsObj.cartAssignment) : [];

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setRealCartActionLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message,
      type,
    }]);
  };

  const handleClearRealCart = async () => {
    if (!selectedUserForActions) {
      message.warning('Vui lòng chọn user');
      return;
    }

    const userId = selectedUserForActions;
    setRealCartActionModalVisible(true);
    setRealCartActionLoading(true);
    setRealCartActionLogs([]);
    setRealCartActionProgress(undefined);

    try {
      addLog('Bắt đầu xóa giỏ hàng thật...', 'info');
      
      const response = await userApi.clearRealCart(userId);
      const result = response.data;

      addLog(`Đã xóa thành công ${result.deletedCount} items khỏi giỏ hàng thật`, 'success');
      message.success(result.message || `Đã xóa thành công ${result.deletedCount} items`);

      // Refresh user list
      await fetchUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      addLog(`Lỗi: ${errorMessage}`, 'error');
      message.error(`Lỗi khi xóa giỏ hàng thật: ${errorMessage}`);
    } finally {
      setRealCartActionLoading(false);
    }
  };

  const handleAddToRealCart = async () => {
    if (!selectedUserForActions) {
      message.warning('Vui lòng chọn user');
      return;
    }

    const userId = selectedUserForActions;
    setRealCartActionModalVisible(true);
    setRealCartActionLoading(true);
    setRealCartActionLogs([]);
    setRealCartActionProgress(undefined);

    try {
      addLog('Bắt đầu thêm vào giỏ hàng thật...', 'info');
      addLog('Đang xóa giỏ hàng thật hiện tại...', 'info');
      
      const response = await userApi.addToRealCart(userId);
      const result = response.data;

      setRealCartActionProgress({
        current: result.successItems,
        total: result.totalItems,
        label: `Đã thêm ${result.successItems}/${result.totalItems} items`,
      });

      addLog(`Đã xử lý ${result.batches} batches`, 'info');
      addLog(`Thành công: ${result.successItems} items`, 'success');
      
      if (result.failedItems > 0) {
        addLog(`Thất bại: ${result.failedItems} items`, 'warning');
      }

      addLog('Hoàn thành!', 'success');
      message.success(`Đã thêm thành công ${result.successItems}/${result.totalItems} items vào giỏ hàng thật`);

      // Refresh user list
      await fetchUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi không xác định';
      addLog(`Lỗi: ${errorMessage}`, 'error');
      message.error(`Lỗi khi thêm vào giỏ hàng thật: ${errorMessage}`);
    } finally {
      setRealCartActionLoading(false);
    }
  };

  const handleFetchCurrentCartState = async () => {
    if (!selectedUserForActions) {
      message.warning('Vui lòng chọn user');
      return;
    }

    const userId = selectedUserForActions;
    const extensionId = extensionIdInput.trim() || getStoredExtensionId();
    if (!extensionId) {
      message.warning('Vui lòng cấu hình Extension ID trước');
      return;
    }

    if (!canUseChromeRuntime()) {
      message.error('Trình duyệt không hỗ trợ Chrome extension API');
      return;
    }

    const selectedUser = users.find(u => (u.id || u._id) === userId);

    setRealCartActionModalVisible(true);
    setRealCartActionLoading(true);
    setRealCartActionLogs([]);
    setRealCartActionProgress(undefined);

    try {
      addLog('Đang kiểm tra session live...', 'info');
      const statusResponse = await userApi.checkLiveStatus(userId);
      const statusData = statusResponse.data;

      if (!statusData.isLive || !statusData.sessionId) {
        throw new Error('Không tìm thấy session đang live (duration = 0). Hãy đảm bảo nick đang live.');
      }

      const sid = statusData.sessionId;
      addLog(`Đã tìm thấy session #${sid}. Đang gửi yêu cầu tới extension...`, 'info');

      const executionId = `web-sync-${Date.now()}`;
      const pairs = await requestCartPairs(extensionId, {
        sid,
        executionId,
        username: selectedUser?.username || selectedUser?.name || userId,
      });

      addLog(`Extension trả về ${pairs.length} sản phẩm. Đang xử lý dữ liệu...`, 'info');

      const normalizedItems = pairs
        .map((pair) => {
          const rawItemId = pair.item_id ?? pair.itemId;
          const rawShopId = pair.shop_id ?? pair.shopId;
          const itemId = Number(rawItemId);
          const shopId = Number(rawShopId);
          if (Number.isNaN(itemId) || Number.isNaN(shopId)) {
            return null;
          }
          return { itemId, shopId };
        })
        .filter((item): item is { itemId: number; shopId: number } => Boolean(item));

      if (normalizedItems.length === 0) {
        throw new Error('Không có sản phẩm hợp lệ để cập nhật giỏ hàng');
      }

      addLog('Đang cập nhật cartRealState lên backend...', 'info');
      await userApi.update(userId, {
        cartRealState: JSON.stringify(normalizedItems),
      });

      addLog(`Đã cập nhật cartRealState với ${normalizedItems.length} sản phẩm`, 'success');

      // Thêm các link vào kho link (tự động bỏ qua link trùng)
      addLog('Đang thêm các link vào kho link...', 'info');
      try {
        // Tạo URL từ itemId và shopId
        const linksToAdd = normalizedItems.map(({ itemId, shopId }) => ({
          fullUrl: `https://shopee.vn/product/${shopId}/${itemId}`,
        }));

        const batchResult = await productLinkApi.batchCreate({
          userId,
          links: linksToAdd,
        });

        if (batchResult.data.created > 0) {
          addLog(`Đã thêm ${batchResult.data.created} link mới vào kho link`, 'success');
        }
        if (batchResult.data.skipped > 0) {
          addLog(`${batchResult.data.skipped} link đã tồn tại trong kho (đã bỏ qua)`, 'info');
        }
      } catch (error: any) {
        // Không fail toàn cục nếu thêm link lỗi
        const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi thêm link vào kho';
        addLog(`Cảnh báo: ${errorMessage}`, 'error');
      }

      message.success(`Đã cập nhật giỏ hàng thật với ${normalizedItems.length} sản phẩm hiện tại`);

      await fetchUsers();
      if (showDetailUserId === userId) {
        await fetchUserDetails(userId);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi đồng bộ giỏ hàng';
      addLog(`Lỗi: ${errorMessage}`, 'error');
      message.error(errorMessage);
    } finally {
      setRealCartActionLoading(false);
    }
  };

  // Tính số link hiện tại trong giỏ (từ cartAssignment)
  const getCurrentCartItemsCount = (cartAssignment?: string): number => {
    if (!cartAssignment) return 0;
    try {
      const parsed = JSON.parse(cartAssignment);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
    } catch (error) {
      console.error('Error parsing cartAssignment:', error);
    }
    return 0;
  };

  const handleSubmit = async (values: CreateUserDto) => {
    try {
      console.log('🚀 Đang gọi API để tạo/cập nhật user với dữ liệu:', values);
      
      if (editingUser) {
        const userId = editingUser.id || editingUser._id;
        console.log('📝 Cập nhật user ID:', userId);
        const response = await userApi.update(userId, values);
        console.log('✅ Cập nhật user thành công:', response.data);
        message.success('Cập nhật user thành công');
      } else {
        console.log('➕ Tạo user mới');
        const response = await userApi.create(values);
        console.log('✅ Tạo user thành công:', response.data);
        message.success('Tạo user thành công');
      }
      setModalVisible(false);
      setActiveTab('1'); // Reset tab về mặc định
      fetchUsers();
    } catch (error: any) {
      console.error('❌ Lỗi khi lưu user:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi lưu user';
      message.error(`Lỗi khi lưu user: ${errorMessage}`);
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 100,
      align: 'center' as const,
      render: (avatar: string) => (
        <Avatar 
          src={avatar} 
          icon={<UserOutlined />}
          size={40}
        />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 200,
      render: (text: string, record: User) => text || record.name || 'Chưa có username',
    },
    
    {
      title: 'Trạng thái Live',
      key: 'liveStatus',
      width: 300,
      align: 'left' as const,
      render: (_: any, record: User) => {
        const userId = record.id || record._id;
        const status = liveStatusMap[userId];
        const sessions = sessionListMap[userId] || [];
        const isLoading = sessionListLoadingMap[userId];
        
        if (!status || status.loading || isLoading) {
          return <Tag color="default">Đang kiểm tra...</Tag>;
        }
        
        // Chọn phiên để hiển thị:
        // - Nếu có phiên đang live (duration = 0) -> dùng phiên này (màu xanh)
        // - Nếu không có -> dùng phiên gần nhất (phần tử đầu tiên) và hiển thị màu cam nhạt
        const liveSession = sessions.find(s => s.duration === 0);
        const displaySession = liveSession || sessions[0];
        if (!displaySession) return <Tag color="default">Không có session</Tag>;
        const isLiveNow = displaySession.duration === 0;
        const accentColor = isLiveNow ? '#22c55e' : '#fb923c';
        const bgColor = isLiveNow ? '#ecfdf3' : '#fff7ed';
        const borderColor = isLiveNow ? '#bbf7d0' : '#fed7aa';
        const chipBg = isLiveNow ? '#dcfce7' : '#ffedd5';
        
        // Format số tiền
        const formatCurrency = (amount?: number) => {
          if (!amount) return '0 ₫';
          return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
        };
        
        // Format thời gian
        const formatTime = (timestamp?: number) => {
          if (!timestamp) return '';
          const date = new Date(timestamp);
          const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return `${time} ${dateStr}`;
        };
        
        return (
          <div style={{ 
            background: bgColor, 
            border: `1px solid ${borderColor}`, 
            borderRadius: '8px', 
            padding: '10px',
            minWidth: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)'
          }}>
            {/* Header gọn */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                background: chipBg,
                color: accentColor,
                borderRadius: '6px',
                padding: '4px 10px',
                fontWeight: 600,
                fontSize: '11px',
                gap: '4px'
              }}>
                <CheckCircleOutlined style={{ color: accentColor, fontSize: '12px' }} />
                <span>#{displaySession.sessionId}</span>
              </div>
              {displaySession.startTime && (
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  {formatTime(displaySession.startTime)}
                </span>
              )}
            </div>
            
            {/* Thông tin session gọn */}
            <div style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.7)',
              border: `1px dashed ${borderColor}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                  {displaySession.title || 'Không có tiêu đề'}
                </span>
              </div>
            </div>
            
            {/* 3 số liệu gọn */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {[
                {
                  label: 'Thêm giỏ',
                  value: displaySession.atc || 0,
                  icon: <ShoppingCartOutlined />,
                  highlight: false,
                },
                {
                  label: 'Đơn hàng',
                  value: displaySession.confirmedOrders || 0,
                  icon: <ShoppingOutlined />,
                  highlight: false,
                },
                {
                  label: 'Doanh số',
                  value: formatCurrency(displaySession.confirmedSales),
                  icon: <DollarOutlined />,
                  highlight: true,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    boxShadow: item.highlight ? '0 2px 6px rgba(34, 197, 94, 0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: item.highlight ? accentColor : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.highlight ? '#ffffff' : '#0f172a',
                      fontSize: '11px'
                    }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#334155' }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: item.highlight ? '14px' : '12px',
                    fontWeight: 700,
                    color: item.highlight ? accentColor : '#0f172a',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái Cookies',
      key: 'cookieStatus',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: User) => {
        const userId = record.id || record._id;
        const isChecking = cookieCheckingMap[userId];
        const status = record.cookieStatus;
        
        if (isChecking) {
          return <Tag color="processing" icon={<ReloadOutlined spin />}>Đang kiểm tra...</Tag>;
        }
        
        if (status === 'valid') {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Hợp lệ</Tag>;
        }
        
        if (status === 'invalid') {
          return <Tag color="error" icon={<CloseCircleOutlined />}>Không hợp lệ</Tag>;
        }
        
        return <Tag color="default">Chưa kiểm tra</Tag>;
      },
    },
    {
      title: 'Link chuẩn bị hiện tại',
      key: 'currentCartItems',
      width: 180,
      align: 'center' as const,
      render: (_: any, record: User) => {
        const count = getCurrentCartItemsCount(record.cartAssignment);
        return <Tag color="blue">{count} link</Tag>;
      },
    },
    {
      title: 'Lần chuẩn bị cuối',
      dataIndex: 'lastPreparedAt',
      key: 'lastPreparedAt',
      width: 220,
      align: 'center' as const,
      render: (text: string, record: User) => {
        if (!text) return <Tag>Chưa có</Tag>;
        const d = new Date(text);
        const summary = record.lastPreparationSummary;
        const hasSummary = summary && summary.final;
        
        return (
          <Space direction="vertical" size={4} align="center">
            <Tooltip title={d.toLocaleString()}>
              <span>{d.toLocaleDateString()}</span>
            </Tooltip>
            {hasSummary && (
              <Tag color="green">
                {summary.final.totalItems} sản phẩm
              </Tag>
            )}
            <Button
              type="link"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => handleOpenPreparationDetailModal(record)}
              style={{ padding: 0, height: 'auto', fontSize: 12 }}
            >
              Xem tóm tắt
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Lần thêm giỏ thật cuối',
      dataIndex: 'lastRealCartAddedAt',
      key: 'lastRealCartAddedAt',
      width: 220,
      align: 'center' as const,
      render: (text: string, record: User) => {
        if (!text) return <Tag>Chưa có</Tag>;
        const d = new Date(text);
        const summary = record.lastRealCartSummary;
        const hasSummary = summary && summary.totalItems;
        
        return (
          <Space direction="vertical" size={4} align="center">
            <Tooltip title={d.toLocaleString()}>
              <span>{d.toLocaleDateString()}</span>
            </Tooltip>
            {hasSummary && (
              <Tag color="blue">
                {summary.successItems}/{summary.totalItems} items
              </Tag>
            )}
            <Button
              type="link"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => handleOpenRealCartDetailModal(record)}
              style={{ padding: 0, height: 'auto', fontSize: 12 }}
            >
              Xem tóm tắt
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 580,
      align: 'center' as const,
      render: (_: any, record: User) => {
        const userId = record.id || record._id;
        const isShowing = showDetailUserId === userId;
        
        return (
          <Space size={12} style={{ display: 'flex', justifyContent: 'center' }}>
            {/* Nút Thao tác - chỉ để chọn user */}
            <Button
              type="primary"
              size="small"
              icon={<DownOutlined />}
              onClick={() => {
                setSelectedUserForActions(userId);
                setManagementModalVisible(true);
                message.info(`Đang mở quản lý giỏ hàng cho ${record.name || record.username || 'User'}`);
              }}
            >
              Thao tác
            </Button>
            
            {/* Nhóm 2: Thêm Link và Thêm Mẫu */}
            <Space.Compact>
              <Button
                size="small"
                icon={<LinkOutlined />}
                onClick={() => handleOpenAddLinkModal(record)}
              >
                Thêm Link
              </Button>
              <Button
                size="small"
                icon={<ExperimentOutlined />}
                onClick={() => handleOpenAddSampleModal(record)}
              >
                Thêm Mẫu
              </Button>
            </Space.Compact>
            
            {/* Nhóm 3: Check Cookies */}
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleCheckCookies(record)}
              loading={cookieCheckingMap[userId]}
              type={record.cookieStatus === 'invalid' ? 'primary' : 'default'}
              danger={record.cookieStatus === 'invalid'}
            >
              Check Cookies
            </Button>
            
            {/* Nhóm 4: Xem, Sửa, Xóa */}
            <Space.Compact>
              <Button
                type={isShowing ? 'default' : 'primary'}
                size="small"
                icon={isShowing ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => handleToggleDetails(record)}
              >
                {isShowing ? 'Ẩn' : 'Xem'}
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Sửa
              </Button>
              <Popconfirm
                title="Bạn có chắc muốn xóa user này?"
                onConfirm={() => handleDelete(userId)}
                okText="Có"
                cancelText="Không"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  Xóa
                </Button>
              </Popconfirm>
            </Space.Compact>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Card
        title="Cấu hình Extension"
        style={{ marginBottom: 16 }}
        extra={
          !chromeRuntimeAvailable && (
            <Tag color="warning">Chrome runtime không khả dụng</Tag>
          )
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            Dán Extension ID (copy từ popup extension) để web có thể giao tiếp trực tiếp với extension đang lấy dữ liệu giỏ hàng.
          </Typography.Paragraph>
          <Input
            placeholder="vd: abcdefghijklmnopqrstuvwxyz123456"
            value={extensionIdInput}
            onChange={(e) => setExtensionIdInput(e.target.value)}
            disabled={extensionChecking}
          />
          <Space>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={handleSaveExtensionId}
              loading={extensionChecking}
              disabled={!extensionIdInput || !chromeRuntimeAvailable}
            >
              Lưu & Ping Extension
            </Button>
            <Button
              onClick={handleSaveOnlyExtensionId}
              disabled={!extensionIdInput}
            >
              Chỉ lưu
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => verifyExtension(extensionIdInput, true)}
              disabled={!extensionIdInput || extensionChecking || !chromeRuntimeAvailable}
            >
              Ping lại
            </Button>
          </Space>
          <Alert
            type={
              !chromeRuntimeAvailable
                ? 'warning'
                : extensionStatus === 'connected'
                  ? 'success'
                  : extensionStatus === 'error'
                    ? 'error'
                    : 'info'
            }
            message={
              !chromeRuntimeAvailable
                ? 'Trình duyệt hiện tại không hỗ trợ giao tiếp với Chrome extension. Hãy mở trang này trong Chrome và bật extension.'
                : extensionStatusDescription[extensionStatus]
            }
            showIcon
          />
        </Space>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>Quản lý User</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm User
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={users.map((user: User) => ({ ...user, id: user.id || user._id }))}
          rowKey={(record: User) => record.id || record._id}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Sửa User' : 'Thêm User'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setActiveTab('1'); // Reset tab khi đóng modal
        }}
        footer={null}
        width={800}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: 'Paste JSON từ Extension',
              children: (
                <div>
                  <TextArea
                    rows={10}
                    placeholder='Paste JSON từ extension vào đây. Ví dụ:
{
  "user": {
    "id": 951392302,
    "name": "1n71o9hspf",
    "avatar": "https://cf.shopee.vn/file/...",
    ...
  },
  "cookies": "SPC_F=...",
  "cookiesFull": [...]
}'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                  <Button type="primary" onClick={handleParseJson} block>
                    Parse và điền vào form
                  </Button>
                </div>
              ),
            },
            {
              key: '2',
              label: 'Form thủ công',
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                >
                  <Form.Item
                    name="username"
                    label="Username"
                  >
                    <Input placeholder="Username từ Shopee" />
                  </Form.Item>

                  <Form.Item
                    name="avatar"
                    label="Avatar URL"
                  >
                    <Input placeholder="URL avatar từ Shopee" />
                  </Form.Item>

                  <Form.Item
                    name="name"
                    label="Tên User"
                  >
                    <Input placeholder="Nhập tên user" />
                  </Form.Item>

                  <Form.Item
                    name="cookies"
                    label="Cookies"
                    rules={[{ required: true, message: 'Vui lòng nhập cookies' }]}
                  >
                    <TextArea rows={4} placeholder="Nhập cookies của user" />
                  </Form.Item>

                  <Form.Item
                    name="cartCapacity"
                    label="Cart Capacity"
                    initialValue={100}
                  >
                    <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="cartAssignment"
                    label="Cart Assignment"
                  >
                    <Input placeholder="Gán cart cho user" />
                  </Form.Item>

                  <Form.Item
                    name="cartRealState"
                    label="Cart Real State"
                  >
                    <TextArea rows={3} placeholder="Trạng thái cart hiện tại trên Shopee" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Mô tả"
                  >
                    <TextArea rows={3} placeholder="Mô tả về user" />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        {editingUser ? 'Cập nhật' : 'Tạo mới'}
                      </Button>
                      <Button onClick={() => setModalVisible(false)}>
                        Hủy
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
          </Modal>

      {/* Modal thêm Link kho */}
      <Modal
        title={`Thêm Link Kho cho ${selectedUserForLink?.name || selectedUserForLink?.username || 'User'}`}
        open={addLinkModalVisible}
        onCancel={() => {
          setAddLinkModalVisible(false);
          setLinkInput('');
          setSelectedUserForLink(null);
        }}
        onOk={handleAddLinks}
        okText="Thêm Links"
        cancelText="Hủy"
        width={700}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">
            Nhập các link Shopee, mỗi link một dòng. Link sẽ được parse để lấy shopId và itemId.
          </Typography.Text>
        </div>
        <TextArea
          rows={12}
          placeholder="Nhập các link Shopee, mỗi link một dòng. Ví dụ:&#10;https://shopee.vn/product/1506174776/27240240844&#10;https://shopee.vn/product/1506174777/27240240845"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
        />
        <div style={{ marginTop: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Số lượng link: {linkInput.split('\n').filter(line => line.trim().length > 0).length}
          </Typography.Text>
        </div>
      </Modal>

      {/* Modal thêm Sản phẩm Mẫu */}
      <Modal
        title={`Thêm Sản phẩm Mẫu cho ${selectedUserForLink?.name || selectedUserForLink?.username || 'User'}`}
        open={addSampleModalVisible}
        onCancel={() => {
          setAddSampleModalVisible(false);
          setSampleInput('');
          setSelectedUserForLink(null);
        }}
        onOk={handleAddSamples}
        okText="Thêm Sản phẩm Mẫu"
        cancelText="Hủy"
        width={700}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">
            Nhập các link sản phẩm mẫu Shopee, mỗi link một dòng. Link sẽ được parse để lấy shopId và itemId.
          </Typography.Text>
        </div>
        <TextArea
          rows={12}
          placeholder="Nhập các link sản phẩm mẫu Shopee, mỗi link một dòng. Ví dụ:&#10;https://shopee.vn/product/1506174776/27240240844&#10;https://shopee.vn/product/1506174777/27240240845"
          value={sampleInput}
          onChange={(e) => setSampleInput(e.target.value)}
        />
        <div style={{ marginTop: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Số lượng link: {sampleInput.split('\n').filter(line => line.trim().length > 0).length}
          </Typography.Text>
        </div>
          </Modal>

      {/* Modal chỉnh sửa Link */}
      <Modal
        title="Chỉnh sửa Link"
        open={editLinkModalVisible}
        onCancel={() => {
          setEditLinkModalVisible(false);
          setEditingLink(null);
          linkForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={linkForm}
          layout="vertical"
          onFinish={handleSubmitEditLink}
        >
          <Form.Item
            name="fullUrl"
            label="URL Sản phẩm Shopee"
            rules={[
              { required: true, message: 'Vui lòng nhập URL' },
              { type: 'url', message: 'URL không hợp lệ' }
            ]}
          >
            <Input placeholder="https://shopee.vn/product/1506174776/27240240844" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Mô tả về sản phẩm" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
              <Button onClick={() => {
                setEditLinkModalVisible(false);
                setEditingLink(null);
                linkForm.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa Sample */}
      <Modal
        title="Chỉnh sửa Sản phẩm Mẫu"
        open={editSampleModalVisible}
        onCancel={() => {
          setEditSampleModalVisible(false);
          setEditingSample(null);
          sampleForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={sampleForm}
          layout="vertical"
          onFinish={handleSubmitEditSample}
        >
          <Form.Item
            name="sampleLink"
            label="Sample Link"
            rules={[{ required: true, message: 'Vui lòng nhập sample link' }]}
          >
            <Input placeholder="Nhập link sản phẩm mẫu" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={3} placeholder="Mô tả về sản phẩm mẫu" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
              <Button onClick={() => {
                setEditSampleModalVisible(false);
                setEditingSample(null);
                sampleForm.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Hiển thị chi tiết Link và Sample */}
      {showDetailUserId && (() => {
        const viewingUser = users.find(u => (u.id || u._id) === showDetailUserId);
        return (
          <div style={{ marginTop: 16 }}>
            {/* Header lớn hiển thị thông tin user đang xem */}
            <Card
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                marginBottom: 16,
                border: 'none',
                padding: '12px 16px',
              }}
            >
              <Space size="middle" style={{ width: '100%', alignItems: 'center' }}>
                <Avatar
                  src={viewingUser?.avatar}
                  icon={<UserOutlined />}
                  size={48}
                  style={{ border: '2px solid white' }}
                />
                <Space direction="vertical" size={4} style={{ flex: 1 }}>
                  <Typography.Title level={4} style={{ color: 'white', margin: 0, fontSize: 18 }}>
                    Đang xem chi tiết: {viewingUser?.name || viewingUser?.username || `User #${showDetailUserId}`}
                  </Typography.Title>
                  <Space size="small">
                    {viewingUser?.username && (
                      <Tag color="white" style={{ color: '#667eea', fontSize: 12, padding: '2px 8px' }}>
                        @{viewingUser.username}
                      </Tag>
                    )}
                    <Tag color="white" style={{ color: '#667eea', fontSize: 12, padding: '2px 8px' }}>
                      Cart Capacity: {viewingUser?.cartCapacity || 0}
                    </Tag>
                  </Space>
                </Space>
                <Button
                  type="default"
                  size="middle"
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => handleToggleDetails(viewingUser!)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                  }}
                >
                  Ẩn chi tiết
                </Button>
              </Space>
            </Card>

            <Card 
              style={{ marginTop: 0 }}
              title={
                <Space>
                  <LinkOutlined />
                  <span>Chi tiết Kho Link và Sản phẩm Mẫu</span>
                  <Tag color="blue">
                    {userProductLinks.length} Link | {userSampleProducts.length} Mẫu
                  </Tag>
                </Space>
              }
              loading={loadingDetails}
            >
          <Tabs
            items={[
              {
                key: 'links',
                label: (
                  <span>
                    <LinkOutlined /> Kho Link ({userProductLinks.filter(link => link.isAssigned).length} đã gán / {userProductLinks.filter(link => !link.isAssigned).length} chưa gán)
                  </span>
                ),
                children: (
                  <div>
                    {(() => {
                      // Filter links dựa trên showReadyLinks
                      // showReadyLinks = true: hiển thị link sẵn sàng (isAssigned = false)
                      // showReadyLinks = false: hiển thị link đã gán (isAssigned = true)
                      const filteredLinks = userProductLinks.filter(link => 
                        showReadyLinks ? !link.isAssigned : link.isAssigned
                      );

                      // Tính toán phân trang
                      const startIndex = (linkPage - 1) * linkPageSize;
                      const endIndex = startIndex + linkPageSize;
                      const paginatedLinks = filteredLinks.slice(startIndex, endIndex);
                      const currentPageSelectedCount = selectedLinkIds.filter(id => 
                        paginatedLinks.some(link => (link.id || link._id) === id)
                      ).length;

                      return filteredLinks.length === 0 ? (
                        <Typography.Text type="secondary">
                          {showReadyLinks ? 'Chưa có link sẵn sàng nào' : 'Chưa có link đã gán nào'}
                        </Typography.Text>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {/* Toolbar cho links */}
                          <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
                            <Space>
                              <Checkbox
                                checked={currentPageSelectedCount === paginatedLinks.length && paginatedLinks.length > 0}
                                indeterminate={currentPageSelectedCount > 0 && currentPageSelectedCount < paginatedLinks.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Chọn tất cả links trên trang hiện tại
                                    const pageLinkIds = paginatedLinks.map(link => link.id || link._id);
                                    setSelectedLinkIds(prev => [...new Set([...prev, ...pageLinkIds])]);
                                  } else {
                                    // Bỏ chọn tất cả links trên trang hiện tại
                                    const pageLinkIds = paginatedLinks.map(link => link.id || link._id);
                                    setSelectedLinkIds(prev => prev.filter(id => !pageLinkIds.includes(id)));
                                  }
                                }}
                              >
                                Chọn trang ({currentPageSelectedCount}/{paginatedLinks.length})
                              </Checkbox>
                              <Space size={8} style={{ marginLeft: 16 }}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  Hiển thị:
                                </Typography.Text>
                                <Switch
                                  size="small"
                                  checked={!showReadyLinks}
                                  onChange={(checked) => {
                                    setShowReadyLinks(!checked);
                                    // Reset selection và page khi chuyển filter
                                    setSelectedLinkIds([]);
                                    setLinkPage(1);
                                  }}
                                  checkedChildren="Đã gán"
                                  unCheckedChildren="Sẵn sàng"
                                />
                              </Space>
                            </Space>
                            <Space>
                              {selectedLinkIds.length > 0 && (
                                <Popconfirm
                                  title={`Bạn có chắc muốn xóa ${selectedLinkIds.length} link đã chọn?`}
                                  onConfirm={handleDeleteLinksBatch}
                                  okText="Có"
                                  cancelText="Không"
                                >
                                  <Button danger size="small" icon={<DeleteOutlined />}>
                                    Xóa đã chọn ({selectedLinkIds.length})
                                  </Button>
                                </Popconfirm>
                              )}
                            </Space>
                          </Space>
                          {paginatedLinks.map((link) => {
                          const url = buildShopeeUrl(link.shopId, link.itemId);
                          return (
                            <Card
                              key={link.id || link._id}
                              size="small"
                              style={{ 
                                backgroundColor: selectedLinkIds.includes(link.id || link._id) ? '#e6f7ff' : '#fafafa',
                                border: selectedLinkIds.includes(link.id || link._id) ? '2px solid #1890ff' : '1px solid #d9d9d9'
                              }}
                            >
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Space>
                                    <Checkbox
                                      checked={selectedLinkIds.includes(link.id || link._id)}
                                      onChange={() => handleToggleLinkSelection(link.id || link._id)}
                                    />
                                  </Space>
                                  <Space direction="vertical" size="small" style={{ flex: 1 }}>
                                    <div>
                                      <Tag color={link.isAssigned ? 'green' : 'orange'}>
                                        {link.isAssigned ? 'Đã gán' : 'Chưa gán'}
                                      </Tag>
                                    </div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                      Shop ID: {link.shopId} | Item ID: {link.itemId}
                                    </Typography.Text>
                                    <div>
                                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        URL: {link.fullUrl}
                                      </Typography.Text>
                                      <Tooltip title="Copy URL">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<CopyOutlined />}
                                          onClick={() => handleCopyUrl(url)}
                                          style={{ marginLeft: 4 }}
                                        />
                                      </Tooltip>
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<LinkOutlined />}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ padding: 0, marginLeft: 8 }}
                                      >
                                        Mở link
                                      </Button>
                                    </div>
                                    {link.description && (
                                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {link.description}
                                      </Typography.Text>
                                    )}
                                  </Space>
                                  <Space>
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => handleEditLink(link)}
                                    >
                                      Sửa
                                    </Button>
                                    <Popconfirm
                                      title="Bạn có chắc muốn xóa link này?"
                                      onConfirm={() => handleDeleteLink(link.id || link._id)}
                                      okText="Có"
                                      cancelText="Không"
                                    >
                                      <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                      >
                                        Xóa
                                      </Button>
                                    </Popconfirm>
                                  </Space>
                                </div>
                              </Space>
                            </Card>
                          );
                        })}
                        {/* Pagination cho links */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                          <Pagination
                            current={linkPage}
                            pageSize={linkPageSize}
                            total={filteredLinks.length}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} link`}
                            pageSizeOptions={['10', '20', '50', '100']}
                            onChange={(page, pageSize) => {
                              setLinkPage(page);
                              setLinkPageSize(pageSize);
                            }}
                            onShowSizeChange={(_, size) => {
                              setLinkPage(1);
                              setLinkPageSize(size);
                            }}
                          />
                        </div>
                      </Space>
                      );
                    })()}
                  </div>
                ),
              },
              {
                key: 'samples',
                label: (
                  <span>
                    <ExperimentOutlined /> Sản phẩm Mẫu ({userSampleProducts.length})
                  </span>
                ),
                children: (
                  <div>
                    {(() => {
                      // Tính toán phân trang cho samples
                      const startIndex = (samplePage - 1) * samplePageSize;
                      const endIndex = startIndex + samplePageSize;
                      const paginatedSamples = userSampleProducts.slice(startIndex, endIndex);
                      const currentPageSelectedCount = selectedSampleIds.filter(id => 
                        paginatedSamples.some(sample => (sample.id || sample._id) === id)
                      ).length;

                      return userSampleProducts.length === 0 ? (
                        <Typography.Text type="secondary">Chưa có sản phẩm mẫu nào</Typography.Text>
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {/* Toolbar cho samples */}
                          <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
                            <Space>
                              <Checkbox
                                checked={currentPageSelectedCount === paginatedSamples.length && paginatedSamples.length > 0}
                                indeterminate={currentPageSelectedCount > 0 && currentPageSelectedCount < paginatedSamples.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Chọn tất cả samples trên trang hiện tại
                                    const pageSampleIds = paginatedSamples.map(sample => sample.id || sample._id);
                                    setSelectedSampleIds(prev => [...new Set([...prev, ...pageSampleIds])]);
                                  } else {
                                    // Bỏ chọn tất cả samples trên trang hiện tại
                                    const pageSampleIds = paginatedSamples.map(sample => sample.id || sample._id);
                                    setSelectedSampleIds(prev => prev.filter(id => !pageSampleIds.includes(id)));
                                  }
                                }}
                              >
                                Chọn trang ({currentPageSelectedCount}/{paginatedSamples.length})
                              </Checkbox>
                            </Space>
                            <Space>
                              {selectedSampleIds.length > 0 && (
                                <Popconfirm
                                  title={`Bạn có chắc muốn xóa ${selectedSampleIds.length} sản phẩm mẫu đã chọn?`}
                                  onConfirm={handleDeleteSamplesBatch}
                                  okText="Có"
                                  cancelText="Không"
                                >
                                  <Button danger size="small" icon={<DeleteOutlined />}>
                                    Xóa đã chọn ({selectedSampleIds.length})
                                  </Button>
                                </Popconfirm>
                              )}
                            </Space>
                          </Space>
                          {paginatedSamples.map((sample) => {
                          const url = sample.shopId && sample.itemId 
                            ? buildShopeeUrl(sample.shopId, sample.itemId)
                            : sample.sampleLink;
                          return (
                            <Card
                              key={sample.id || sample._id}
                              size="small"
                              style={{ 
                                backgroundColor: selectedSampleIds.includes(sample.id || sample._id) ? '#e6f7ff' : '#fafafa',
                                border: selectedSampleIds.includes(sample.id || sample._id) ? '2px solid #1890ff' : '1px solid #d9d9d9'
                              }}
                            >
                              <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Space>
                                    <Checkbox
                                      checked={selectedSampleIds.includes(sample.id || sample._id)}
                                      onChange={() => handleToggleSampleSelection(sample.id || sample._id)}
                                    />
                                  </Space>
                                  <Space direction="vertical" size="small" style={{ flex: 1 }}>
                                    {sample.shopId && sample.itemId && (
                                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Shop ID: {sample.shopId} | Item ID: {sample.itemId}
                                      </Typography.Text>
                                    )}
                                    <div>
                                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        URL: {sample.sampleLink}
                                      </Typography.Text>
                                      <Tooltip title="Copy URL">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<CopyOutlined />}
                                          onClick={() => handleCopyUrl(url)}
                                          style={{ marginLeft: 4 }}
                                        />
                                      </Tooltip>
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<LinkOutlined />}
                                        href={sample.sampleLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ padding: 0, marginLeft: 8 }}
                                      >
                                        Mở link
                                      </Button>
                                    </div>
                                    {sample.description && (
                                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {sample.description}
                                      </Typography.Text>
                                    )}
                                  </Space>
                                  <Space>
                                    <Button
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => handleEditSample(sample)}
                                    >
                                      Sửa
                                    </Button>
                                    <Popconfirm
                                      title="Bạn có chắc muốn xóa sản phẩm mẫu này?"
                                      onConfirm={() => handleDeleteSample(sample.id || sample._id)}
                                      okText="Có"
                                      cancelText="Không"
                                    >
                                      <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                      >
                                        Xóa
                                      </Button>
                                    </Popconfirm>
                                  </Space>
                                </div>
                              </Space>
                            </Card>
                          );
                        })}
                        {/* Pagination cho samples */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                          <Pagination
                            current={samplePage}
                            pageSize={samplePageSize}
                            total={userSampleProducts.length}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} mẫu`}
                            pageSizeOptions={['10', '20', '50', '100']}
                            onChange={(page, pageSize) => {
                              setSamplePage(page);
                              setSamplePageSize(pageSize);
                            }}
                            onShowSizeChange={(_, size) => {
                              setSamplePage(1);
                              setSamplePageSize(size);
                            }}
                          />
                        </div>
                      </Space>
                      );
                    })()}
                  </div>
                ),
              },
            ]}
          />
        </Card>
        </div>
        );
      })()}

      <PrepareProductsModal
        visible={prepareModalVisible}
        onClose={() => setPrepareModalVisible(false)}
        user={userForPreparation}
        onSuccess={() => {
          setPrepareModalVisible(false);
          fetchUsers(); // Tải lại danh sách user để cập nhật lastPreparedAt
        }}
      />
      <Modal
        title="Quản lý Giỏ Hàng & Chuẩn Bị Sản Phẩm"
        open={managementModalVisible}
        onCancel={() => setManagementModalVisible(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Thông tin User đã chọn */}
          {selectedUserForActionsObj && (
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                User đã chọn: <Tag color="blue">{selectedUserForActionsObj.name || selectedUserForActionsObj.username || 'User'}</Tag>
              </Typography.Text>
            </div>
          )}

          {!selectedUserForActionsObj && (
            <Alert
              message="Chưa chọn user"
              description="Vui lòng chọn user từ nút 'Thao tác' trong bảng để thực hiện các thao tác."
              type="info"
              showIcon
            />
          )}

          {/* Preview Cart Assignment */}
          {selectedUserForActionsObj && selectedUserCartAssignment.length > 0 && (
            <Card size="small" style={{ background: '#f0f2f5' }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Preview - Giỏ đã chuẩn bị:
              </Typography.Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Typography.Text type="secondary">
                  Tổng số items: <Tag color="blue">{selectedUserCartAssignment.length}</Tag>
                </Typography.Text>
                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', background: '#fff', borderRadius: '4px' }}>
                  {selectedUserCartAssignment.slice(0, 20).map((item: any, index: number) => (
                    <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <Tag color="cyan">Item {index + 1}:</Tag> ShopID: {item.shopId}, ItemID: {item.itemId}
                    </div>
                  ))}
                  {selectedUserCartAssignment.length > 20 && (
                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                      ... và {selectedUserCartAssignment.length - 20} items khác
                    </Typography.Text>
                  )}
                </div>
              </Space>
            </Card>
          )}

          {selectedUserForActionsObj && selectedUserCartAssignment.length === 0 && (
            <Alert
              message="Chưa có giỏ hàng đã chuẩn bị"
              description="User này chưa có cartAssignment. Vui lòng sử dụng chức năng 'Chuẩn bị SP' từ nút 'Thao tác' trong bảng."
              type="warning"
              showIcon
            />
          )}

          {/* Các nút chức năng */}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Chuẩn bị SP */}
            <Card size="small" style={{ border: '1px solid #d9d9d9' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text strong>Chuẩn bị Sản phẩm</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        Tự động chuẩn bị sản phẩm từ Live Session và Kho Link dựa trên cấu hình. 
                        Sản phẩm sẽ được gán vào cartAssignment.
                      </Typography.Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={() => {
                      if (!selectedUserForActionsObj) {
                        message.warning('Vui lòng chọn user từ nút "Thao tác" trong bảng');
                        return;
                      }
                      handleOpenPrepareModal(selectedUserForActionsObj);
                    }}
                    disabled={!selectedUserForActions}
                  >
                    Chuẩn bị SP
                  </Button>
                </div>
              </Space>
            </Card>

            {/* Lấy giỏ hàng hiện tại */}
            <Card size="small" style={{ border: '1px solid #d9d9d9' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text strong>Lấy giỏ hàng hiện tại</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        Yêu cầu extension đọc giỏ hàng thật trên Shopee Live và cập nhật lại trường cartRealState của user.
                      </Typography.Text>
                    </div>
                  </div>
                  <Button
                    icon={<ShoppingCartOutlined />}
                    type="primary"
                    onClick={handleFetchCurrentCartState}
                    disabled={!selectedUserForActions || realCartActionLoading}
                    loading={realCartActionLoading}
                  >
                    Lấy giỏ hiện tại
                  </Button>
                </div>
              </Space>
            </Card>

            {/* Xóa giỏ hàng thật */}
            <Card size="small" style={{ border: '1px solid #d9d9d9' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text strong>Xóa Giỏ Hàng Thật</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        Xóa tất cả items trong giỏ hàng thật trên Shopee Live (từ cartRealState). 
                        Cần có session đang live (duration = 0).
                      </Typography.Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    danger
                    onClick={handleClearRealCart}
                    disabled={!selectedUserForActions || realCartActionLoading}
                    loading={realCartActionLoading}
                  >
                    Xóa Giỏ Hàng Thật
                  </Button>
                </div>
              </Space>
            </Card>

            {/* Thêm giỏ hàng thật */}
            <Card size="small" style={{ border: '1px solid #d9d9d9' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text strong>Thêm Giỏ Hàng Thật</Typography.Text>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                        Thêm items từ cartAssignment vào giỏ hàng thật trên Shopee Live. 
                        Tự động xóa giỏ hàng thật hiện tại trước khi thêm mới. 
                        Chia batch 100 items/lần, sử dụng Product Set API (Create → Attach → Delete).
                      </Typography.Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    onClick={handleAddToRealCart}
                    disabled={!selectedUserForActions || realCartActionLoading || selectedUserCartAssignment.length === 0}
                    loading={realCartActionLoading}
                  >
                    Thêm Giỏ Hàng Thật
                  </Button>
                </div>
              </Space>
            </Card>
          </Space>
        </Space>
      </Modal>

      <PreparationDetailModal
        visible={preparationDetailModalVisible}
        onClose={() => {
          setPreparationDetailModalVisible(false);
          setSelectedPreparationUser(null);
        }}
        summary={selectedPreparationUser?.lastPreparationSummary}
        user={selectedPreparationUser || undefined}
        lastPreparedAt={selectedPreparationUser?.lastPreparedAt}
      />

      <RealCartDetailModal
        visible={realCartDetailModalVisible}
        onClose={() => {
          setRealCartDetailModalVisible(false);
          setSelectedRealCartUser(null);
        }}
        summary={selectedRealCartUser?.lastRealCartSummary}
        user={selectedRealCartUser || undefined}
        lastRealCartAddedAt={selectedRealCartUser?.lastRealCartAddedAt}
      />

      <Modal
        title="Thực thi giỏ hàng thật"
        open={realCartActionModalVisible}
        onCancel={() => {
          if (!realCartActionLoading) {
            setRealCartActionModalVisible(false);
            setRealCartActionLogs([]);
            setRealCartActionProgress(undefined);
          }
        }}
        footer={null}
        width={800}
        closable={!realCartActionLoading}
        maskClosable={!realCartActionLoading}
      >
        <RealCartActionLog
          logs={realCartActionLogs}
          loading={realCartActionLoading}
          progress={realCartActionProgress}
          success={!realCartActionLoading && realCartActionLogs.length > 0 && realCartActionLogs[realCartActionLogs.length - 1].type === 'success'}
          error={!realCartActionLoading && realCartActionLogs.length > 0 ? realCartActionLogs.find(log => log.type === 'error')?.message : undefined}
        />
      </Modal>
    </div>
  );
};

export default UserManagement;

