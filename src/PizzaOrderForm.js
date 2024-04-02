import React, { useState } from 'react';
import { Form, Select, Button, message, Card, Table  } from 'antd';

const { Option } = Select;

const PizzaOrderForm = () => {
  const [form] = Form.useForm(); // Use Form hook to create form instance
  const [orderCount, setOrderCount] = useState(0);
  const [formData, setFormData] = useState({});
  const [ids, setIds] = useState([]);
  const [counter, setCounter] = useState(1);
  const [timers, setTimers] = useState({});
  const [orders, setOrders] = useState([]);

  const onFinish = (values) => {
    if (orderCount >= 10) {
      message.error('Not taking any order for now');
    } else {
      console.log('Received values:', values);
      // Handle form submission logic here (e.g., sending data to backend)
      setOrderCount(orderCount + 1);
      form.resetFields(); // Reset form fields
      message.success('Pizza ordered successfully');
    }

    const newId = String(counter).padStart(3, '0');
    
    // Store form data with new ID
    const newData = { id: newId, ...formData };    
    // Update IDs array and increment counter
    setIds([...ids, newId]);
    setCounter(counter + 1);
    
    // Clear form data
    setFormData({});
    
    // Start timer for this order
     const timerId = setInterval(() => {
      // Update timer state
      setTimers((prevTimers) => ({
        ...prevTimers,
        [newId]: {'current': ((prevTimers[newId]['current'] || 0) + 1), 'total': ((prevTimers[newId]['total'] || 0) + 1)},
      }));
    }, 1000);

    // Store timer ID in state
    setTimers((prevTimers) => ({
      ...prevTimers,
      [newId]: {'current': 0, 'total': 0}, // Start timer from 0 for each new ID
    }));
    setOrders([...orders, { ...newData, stage: 'Order Placed', timerId: timerId }]);

  };

  const moveToNextStage = (id, action) => {
    console.log(timers)
    setOrders((prevOrders) => {
        console.log(prevOrders)
      return prevOrders.map((order) => {
        if (order.id === id) {
          if (action === 'cancel' && (order.stage === 'Order Placed' || order.stage === 'Order in Making')) {
            clearInterval(order.timerId); // Stop the timer
            return { ...order, stage: 'Cancelled', timerId: null }; // Set stage to Cancelled and remove timer ID
          } else {
            debugger
            const newStage = nextStage(order.stage);
            if (order.timerId) {
              setTimers((prevTimers) => ({
                ...prevTimers,
                [id]: {'total': prevTimers[id]['total'] ,'current': 0},
              }));
              return { ...order, stage: newStage }; // Move to next stage and start new timer
            } else {
              return { ...order, stage: newStage }; // Move to next stage without starting new timer
            }
          }
        }
        return order;
      });
    });
  };
    

const nextStage = (currentStage) => {
  switch (currentStage) {
    case 'Order Placed':
      return 'Order in Making';
    case 'Order in Making':
      return 'Order Ready';
    case 'Order Ready':
      return 'Order Picked';
    default:
      return currentStage;
  }
};


   // Calculate the total number of orders picked
   const totalOrdersPicked = orders.filter((order) => order.stage === 'Order Picked').length;


  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      sorter: (a, b) => a.stage.localeCompare(b.stage),
    },
    {
      title: 'Total Time Spent',
      dataIndex: 'timeSpent',
      key: 'timeSpent',
      sorter: (a, b) => a.timeSpent - b.timeSpent,
      render: (text, record) => (
        <>
          {Math.floor(timers[record.id]['total'] / 60)} minutes {timers[record.id]['total'] % 60} seconds
        </>
      ),
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
          <>
            {(record.stage === 'Order Placed' ||record.stage === 'Order in Making') && (
              <Button type="primary" onClick={() => moveToNextStage(record.id, 'cancel')}>Cancel</Button>
            )}
          </>
        ),
      },
  ];

  const dataSource = [
    ...orders,
  ];
  

  return (
    <>
    <div className="container">
    <Form form={form} name="pizza_order" onFinish={onFinish}>
      <Form.Item name="type" label="Type" rules={[{ required: true }]}>
        <Select placeholder="Select type" onChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
          <Option value="veg">Veg</Option>
          <Option value="non-veg">Non-Veg</Option>
        </Select>
      </Form.Item>

      <Form.Item name="size" label="Size" rules={[{ required: true }]}>
        <Select placeholder="Select size" onChange={(value) => setFormData((prev) => ({ ...prev, size: value }))}>
          <Option value="large">Large</Option>
          <Option value="medium">Medium</Option>
          <Option value="small">Small</Option>
        </Select>
      </Form.Item>

      <Form.Item name="base" label="Base" rules={[{ required: true }]}>
        <Select placeholder="Select base" onChange={(value) => setFormData((prev) => ({ ...prev, base: value }))}>
          <Option value="thin">Thin</Option>
          <Option value="thick">Thick</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Place Order
        </Button>
      </Form.Item>
    </Form>
    </div>
    
    <div style={{ display: 'flex' }}>
        {['Order Placed', 'Order in Making', 'Order Ready', 'Order Picked'].map((stage) => (
          <Card key={stage} title={stage} style={{ width: 300, marginRight: 16 }}>
            <ul>
              {orders
                .filter((order) => order.stage === stage)
                .sort((a, b) => a.id - b.id)
                .map((order) => (   
                  <li key={order.id} className={`ids ${stage !== 'Order Picked' 
                  && ((order.size === 'small' && timers[order.id]['current'] >= 180) 
                  || (order.size === 'medium' && timers[order.id]['current'] >= 240) 
                  || (order.size === 'large' && timers[order.id]['current'] >= 300)) ? 'red-bg' : ''}`}>
                    <div>Order ID: {order.id}</div>
                    <div>{Math.floor(timers[order.id]['current'] / 60)} minutes {timers[order.id]['current'] % 60} seconds</div>
                    {stage !== 'Order Picked' && (
                      <Button type="primary" onClick={() => moveToNextStage(order.id)}>Next</Button>
                    )}
                  </li>
                ))}
            </ul>
          </Card>
        ))}
    </div>

     <div>
     <Table
         dataSource={dataSource}
          columns={columns}
          rowClassName={(record) => record.stage === 'Cancelled' ? 'cancelled-order' : ''}
          pagination={false}
          onChange={(sorter) => console.log('Table sorted', sorter)}
        />
      
    <h4>Total Orders Deliverd  {totalOrdersPicked}</h4>
    </div>
    </>
  );
};

export default PizzaOrderForm;
