import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, message, Spin, Alert } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { User, PrepareProductsResult, PrepareProductsDto } from '../../types';
import { liveSessionConfigApi, userApi } from '../../services/api';
import LiveSessionConfigForm from './LiveSessionConfigForm';
import PreparationSummary from './PreparationSummary';
import PreparedItemsList from './PreparedItemsList';

interface Props {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

const PrepareProductsModal: React.FC<Props> = ({ visible, onClose, user, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saveConfig, setSaveConfig] = useState(true);
  const [result, setResult] = useState<PrepareProductsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && visible) {
      setResult(null);
      setError(null);
      setLoadingConfig(true);
      liveSessionConfigApi.getByUserId(user.id || user._id)
        .then(response => {
          form.setFieldsValue(response.data);
        })
        .catch(() => {
          message.warning('Không tìm thấy cấu hình đã lưu, sử dụng giá trị mặc định.');
          // Set giá trị mặc định nếu không có config
          form.setFieldsValue({ numberOfSessions: 3, minAtc: 5, minRevenue: 0 });
        })
        .finally(() => setLoadingConfig(false));
    }
  }, [user, visible, form]);

  const handlePrepare = async () => {
    if (!user) return;

    try {
      const values: PrepareProductsDto = await form.validateFields();
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('[DEBUG] Preparing products with config:', values);
      const apiResult = await userApi.prepareProducts(user.id || user._id, values);
      console.log('[DEBUG] API Response:', apiResult);
      console.log('[DEBUG] API Response Data:', apiResult.data);

      // Kiểm tra format response
      if (!apiResult.data || !apiResult.data.summary) {
        console.error('[DEBUG] Invalid response format:', apiResult.data);
        throw new Error('Response không đúng định dạng. Vui lòng kiểm tra backend logs.');
      }

      setResult(apiResult.data);

      if (saveConfig) {
        await liveSessionConfigApi.update(user.id || user._id, values);
      }
      
      // Hiển thị thông báo về việc xóa link không được dùng
      if (apiResult.data.summary?.deletedUnusedLinks && apiResult.data.summary.deletedUnusedLinks > 0) {
        message.warning(
          `Đã chuẩn bị sản phẩm thành công! Đã xóa ${apiResult.data.summary.deletedUnusedLinks} link không được sử dụng từ lần chuẩn bị trước.`,
          5
        );
      } else {
        message.success('Đã chuẩn bị sản phẩm thành công!');
      }
      // Không gọi onSuccess ngay để user có thể xem kết quả trước
    } catch (err: any) {
      console.error('[DEBUG] Error preparing products:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi không xác định';
      setError(errorMessage);
      message.error(`Lỗi khi chuẩn bị sản phẩm: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    // Database đã được cập nhật rồi (từ backend), chỉ cần refresh và đóng modal
    message.success('Đã cập nhật giỏ hàng thành công!');
    onSuccess(); // Refresh user list
    handleClose();
  };

  const handleClose = () => {
    if (loading) return; // Không cho đóng khi đang tải
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={`Chuẩn bị sản phẩm cho: ${user?.name || user?.username}`}
      open={visible}
      onCancel={handleClose}
      width={result ? 1000 : 600}
      footer={
        result
          ? [
              <Button key="back" onClick={handleClose}>
                Hủy
              </Button>,
              <Button key="confirm" type="primary" onClick={handleConfirm}>
                Xác nhận & Cập nhật Cart
              </Button>,
            ]
          : [
              <Button key="back" onClick={handleClose} disabled={loading}>
                Hủy
              </Button>,
              <Button key="submit" type="primary" loading={loading} onClick={handlePrepare}>
                Bắt đầu chuẩn bị
              </Button>,
            ]
      }
    >
      <Spin spinning={loading || loadingConfig} tip={loadingConfig ? 'Đang tải cấu hình...' : 'Đang chuẩn bị sản phẩm...'}>
        {error && <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        
        {result ? (
          <div>
            {result.summary?.deletedUnusedLinks && result.summary.deletedUnusedLinks > 0 && (
              <Alert
                message={
                  <span>
                    <DeleteOutlined /> Đã xóa <strong>{result.summary.deletedUnusedLinks}</strong> link không được sử dụng
                  </span>
                }
                description="Các link trong cartAssignment cũ mà không được sử dụng lại trong lần chuẩn bị này đã được xóa khỏi kho."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <PreparationSummary summary={result.summary} />
            {result.items && result.items.length > 0 && (
              <PreparedItemsList items={result.items} />
            )}
            {(!result.items || result.items.length === 0) && (
              <Alert
                message="Không có sản phẩm nào được chuẩn bị"
                description="Vui lòng kiểm tra lại cấu hình và đảm bảo có sản phẩm trong kho hoặc session live có sản phẩm khớp."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        ) : (
          <LiveSessionConfigForm 
            form={form} 
            initialValues={{}}
            saveConfig={saveConfig}
            onSaveConfigChange={(e) => setSaveConfig(e.target.checked)}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default PrepareProductsModal;

