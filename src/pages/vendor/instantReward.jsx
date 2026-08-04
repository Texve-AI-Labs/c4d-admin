import React, { useState, useEffect, useMemo } from 'react';
import { Formik, Field, ErrorMessage, Form } from 'formik';
import { Button, Spinner } from '@material-tailwind/react';
import { ColorStyles, API_ROUTES } from '@/utils/constants';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import Select from 'react-select';
import moment from 'moment';

const validationSchema = Yup.object({
  phoneNumber: Yup.string().when('selectedType', {
    is: 'Driver',
    then: (schema) => schema.required('Phone Number is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount (e.g., 10 or 10.00)'),
  customerId: Yup.array().when('selectedType', {
    is: 'Customer',
    then: (schema) =>
      schema
        .min(1, 'At least one customer must be selected')
        .required('Customer selection is required'),
    otherwise: (schema) => schema.max(0, 'Customer should not be selected for Drivers'),
  }),
});

const InstantReward = () => {
  const [customers, setCustomers] = useState([]);
  const [rewardsData, setRewardsData] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [isSubmittingReward, setIsSubmittingReward] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
  const navigate = useNavigate();

  const initialValues = {
    phoneNumber: '',
    amount: '',
    customerId: [],
    selectedType: 'Customer',
  };
  const totalPages = Math.ceil(rewardsData.length / itemsPerPage);

const paginatedRewards = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return rewardsData.slice(start, end);
}, [rewardsData, currentPage]);
  const getCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setError(null);
      const customerData = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ALL_CUSTOMERS,{
        forSearch:true
      });
      // console.log('Customer Data:', customerData?.data);
      setCustomers(customerData?.success && customerData?.data.length > 0 ? customerData.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoadingCustomers(false);
    }
  };
const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) {
    setCurrentPage(page);
  }
};
  const fetchRewards = async (selectedType = initialValues.selectedType) => {
    setLoadingRewards(true);
    setError(null);
    try {
      const rewardsData = await ApiRequestUtils.get(API_ROUTES.GET_REWARD)
        // page: pagination.currentPage,
        // limit: pagination.itemsPerPage,}
      // console.log('Rewards Data:', rewardsData?.data);

      if (rewardsData?.success && rewardsData?.data.length > 0) {
        const filteredRewards = rewardsData.data
          .filter((reward) => selectedType === 'Customer' || selectedType === 'Driver')
          .filter((reward) => {
            if (selectedType === 'Customer' && reward.customerId?.length > 0) {
              return reward.customerId.some((id) => customers.some((c) => c.id === id));
            } else if (selectedType === 'Driver' && reward.driverId?.length > 0) {
              return reward.Drivers?.length > 0;
            }
            return false;
          })
          .map((reward) => {
            let name = '-';
            let phoneNumber = '-';
            if (selectedType === 'Customer' && reward.customerId?.length > 0) {
              const matchedCustomers = customers.filter((c) => reward.customerId.includes(c.id));
              name = matchedCustomers.map((c) => c.firstName).join(', ');
              phoneNumber = matchedCustomers.map((c) => c.phoneNumber || '-').join(', ');
            } else if (selectedType === 'Driver' && reward.driverId?.length > 0) {
              const matchedDrivers = reward.Drivers || [];
              name = matchedDrivers.map((d) => d.firstName || 'Driver').join(', ');
              phoneNumber = matchedDrivers.map((d) => d.phoneNumber || '-').join(', ');
            }

            return {
              id: reward.id || `${selectedType}-${reward.created_at || 'unknown'}-${reward.amount || '0'}-${name}`,
              name,
              phoneNumber,
              amount: reward.amount || '',
              created_at: reward.created_at || 'N/A',
              type: selectedType,
            };
          });

        setRewardsData(filteredRewards);
        setCurrentPage(1);
        // setPagination({
        //   currentPage: rewardsData.pagination?.currentPage || 1,
        //   totalPages: rewardsData.pagination?.totalPages || 1,
        //   totalItems: rewardsData.pagination?.totalItems || 0,
        //   itemsPerPage: rewardsData.pagination?.itemsPerPage || 10,
        // });
      } else {
        setRewardsData([]);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setError('Failed to load rewards data');
    } finally {
      setLoadingRewards(false);
    }
  };

  useEffect(() => {
    getCustomers();
    }, []);

  useEffect(() => {
    if (customers.length === 0) {
      return;
    }
    fetchRewards('Customer');
  }, [customers]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsSubmittingReward(true);
      setError(null);
      const payload = {
        serviceType: values.selectedType.toUpperCase(),
        amount: values.amount,
        phoneNumber: values.selectedType === 'Driver' ? values.phoneNumber : undefined,
        customerId: values.selectedType === 'Customer' ? values.customerId : undefined,
      };
      // console.log('Submit Payload:', payload);
      const data = await ApiRequestUtils.post(API_ROUTES.INSTANT_REWARD, payload);
      if (data?.success) {
        setModalData({ message: 'The Reward is sent successfully' });
        resetForm();
        fetchRewards(values.selectedType);
        setTimeout(() => {
          setModalData(null);
          navigate('/dashboard/finance/instant-reward');
        }, 2000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.response?.data?.message || 'Failed to send reward. Please try again.');
    } finally {
      setIsSubmittingReward(false);
      setSubmitting(false);
    }
  };

  // const handlePageChange = (page) => {
  //   if (page >= 1 && page <= pagination.totalPages && !isLoading) {
  //     setPagination((prev) => ({ ...prev, currentPage: page }));
  //   }
  // };

  const generatePageButtons = () => {
  const buttons = [];
  const maxVisible = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    buttons.push(
      <Button
        key={i}
        size="sm"
        variant={i === currentPage ? "filled" : "outlined"}
        className={`mx-1 ${ColorStyles.bgColor} text-white`}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </Button>
    );
  }

  return buttons;
};

  const customerOptions = useMemo(
    () =>
      customers.filter((c) => c.firstName && c.phoneNumber).map((c) => ({
          value: c.id,
          label: `${c.firstName} ${c.phoneNumber ? `(${c.phoneNumber})` : ''}`,
        })),
    [customers]
  );

  const closeModal = () => {
    setModalData(null);
  };

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md max-w-7xl">
      <h2 className="text-2xl font-bold mb-4">Add New Reward</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, values }) => {
          // console.log('Form Values:', values);
          return (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
                    <div className="space-x-4">
                      <label className="inline-flex items-center">
                        <Field
                          type="radio"
                          name="selectedType"
                          value="Customer"
                          className="form-radio"
                          onChange={() => {
                            setFieldValue('selectedType', 'Customer');
                            setFieldValue('customerId', []);
                            setFieldValue('phoneNumber', '');
                            fetchRewards('Customer');
                          }}
                        />
                        <span className="ml-2">Customers</span>
                      </label>
                      <label className="inline-flex items-center">
                        <Field
                          type="radio"
                          name="selectedType"
                          value="Driver"
                          className="form-radio"
                          onChange={() => {
                            setFieldValue('selectedType', 'Driver');
                            setFieldValue('customerId', []);
                            setFieldValue('phoneNumber', '');
                            fetchRewards('Driver');
                          }}
                        />
                        <span className="ml-2">Drivers</span>
                      </label>
                    </div>
                  </div>
                  {values.selectedType === 'Customer' && (
                    <div>
                      <label htmlFor="customerId" className="text-sm font-medium text-gray-700">Select Customers</label>
                      <Select
                        isMulti
                        name="customerId"
                        options={customerOptions}
                        value={customers
                          .filter((item) => values.customerId.includes(item.id))
                          .map((item) => ({
                            value: item.id,
                            label: `${item.firstName} ${item.phoneNumber ? `(${item.phoneNumber})` : ''}`,
                          }))}
                        onChange={(selected) => {
                          const ids = selected ? selected.map((item) => item.value) : [];
                          // console.log('Selected Customer IDs:', ids);
                          setFieldValue('customerId', ids);
                          setFieldValue('phoneNumber', '');
                        }}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={
                          customerOptions.length === 0
                            ? 'No customers available'
                            : 'Select Customers'
                        }
                        isDisabled={isSubmitting || customerOptions.length === 0}
                        styles={{
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: '#3b82f6',
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: '#fff',
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: '#fff',
                            ':hover': {
                              backgroundColor: '#2563eb',
                              color: '#fff',
                            },
                          }),
                        }}
                      />
                      <ErrorMessage name="customerId" component="div" className="text-red-500 text-sm"/>
                    </div>
                  )}
                  {values.selectedType === 'Driver' && (
                    <div>
                      <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">Phone Number</label>
                      <Field type="text" name="phoneNumber" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                        disabled={isSubmitting}
                      />
                      <ErrorMessage name="phoneNumber" component="div" className="text-red-500 text-sm" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <Field
                      type="text" name="amount" className="p-2 w-full rounded-md border-2 border-gray-300 shadow-sm"
                      disabled={isSubmitting}
                    />
                    <ErrorMessage name="amount" component="div" className="text-red-500 text-sm my-1" />
                  </div>
                </div>
              </div>
              <div className="flex flex-row">
                <Button
                  fullWidth
                  className={`my-6 mx-2 rounded-xl ${ColorStyles.backButton}`}
                  type="button"
                  onClick={() => navigate(`/dashboard`)}
                  disabled={isSubmitting || isSubmittingReward}
                >
                  Back
                </Button>
                <Button
                  fullWidth
                  color="black"
                  className={`my-6 px-8 border-2 rounded-xl ${ColorStyles.continueButtonColor}`}
                  type="submit"
                  disabled={
                    isSubmitting || isSubmittingReward ||
                    !values.amount ||
                    (values.selectedType === 'Customer' && values.customerId.length === 0) ||
                    (values.selectedType === 'Driver' && !values.phoneNumber)
                  }
                >
                  {isSubmitting || isSubmittingReward ? 'Sending...' : 'Send'}
                </Button>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Rewards Details</h2>


                {loadingRewards || loadingCustomers ? (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <Spinner className="h-12 w-12" />
                  </div>
                ) : (
                  <>
                    <table className="w-full border bg-blue-gray-50 py-3 text-sm">
                      <thead className="text-left">
                        <tr>
                          <th className="p-2 border bg-primary text-white font-bold">
                            {values.selectedType === 'Customer' ? 'Customer Name' : 'Driver Name'}
                          </th>
                          <th className="p-2 border bg-primary text-white font-bold">Phone Number</th>
                          <th className="p-2 border bg-primary text-white font-bold">Amount</th>
                          <th className="p-2 border bg-primary text-white font-bold">Created Date</th>
                          <th className="p-2 border bg-primary text-white font-bold">Service Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rewardsData.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-2 text-center">
                              No rewards details
                            </td>
                          </tr>
                        ) : (
                          paginatedRewards.map((reward) => (
                            <tr key={reward.id} className="border-b bg-white">
                              <td className="p-2 border">{reward.name}</td>
                              <td className="p-2 border">{reward.phoneNumber}</td>
                              <td className="p-2 border font-bold"> ₹ {reward.amount}</td>
                              <td className="p-2 border">
                                {moment(reward.created_at).format('DD-MM-YYYY / hh:mm A')}
                              </td>
                              <td className="p-2 border">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${
                                    reward.type === 'Customer'
                                      ? 'bg-orange-500'
                                      : reward.type === 'Driver'
                                        ? 'bg-gray-500'
                                        : 'bg-blue-500'
                                  }`}
                                >
                                  {reward.type}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  <div className="flex items-center justify-center mt-4">
                      <Button
                        size="sm"
                        variant="text"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="mx-1"
                      >
                        {"<"}
                      </Button>
                      {generatePageButtons()}
                      <Button
                        size="sm"
                        variant="text"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="mx-1"
                      >
                        {">"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
      {modalData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          role="dialog"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 id="modal-title" className="text-lg font-bold mb-4">
              Success
            </h3>
            <p className="text-gray-600">{modalData.message}</p>
            <div className="mt-4 flex justify-end">
              <Button
                color="black"
                className={`px-4 rounded-xl ${ColorStyles.continueButtonColor}`}
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-sm mt-4 text-center">{error}</div>
      )}
    </div>
  );
};

export default InstantReward;