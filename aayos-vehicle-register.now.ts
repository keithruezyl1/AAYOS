import React, { useState } from 'react';
import { createRoot } from '@devsnc/library-uxf';

interface VehicleFormData {
  make: string;
  model: string;
  model_year: string;
  vehicle_category: string;
  fuel_type: string;
  transmission: string;
  vin: string;
  plate_number: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  preferred_contact_method: string;
  usage_type: string;
  load_type: string;
  driving_condition_profile: string;
  has_tcu: string;
  region_climate: string;
  current_mileage: string;
  estimated_monthly_mileage: string;
  last_service_date: string;
  last_service_odometer: string;
  last_oil_change_date: string;
  last_oil_change_odometer: string;
  last_brake_service_date: string;
  last_brake_service_odometer: string;
  last_tire_service_date: string;
  last_tire_service_odometer: string;
  last_battery_service_date: string;
  last_battery_service_odometer: string;
}

function VehicleRegister() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '', model: '', model_year: '', vehicle_category: '', fuel_type: '', transmission: '', vin: '', plate_number: '',
    owner_name: '', owner_phone: '', owner_email: '', preferred_contact_method: 'phone', usage_type: '', load_type: '',
    driving_condition_profile: '', has_tcu: 'false', region_climate: '',
    current_mileage: '', estimated_monthly_mileage: '', last_service_date: '', last_service_odometer: '',
    last_oil_change_date: '', last_oil_change_odometer: '', last_brake_service_date: '', last_brake_service_odometer: '',
    last_tire_service_date: '', last_tire_service_odometer: '', last_battery_service_date: '', last_battery_service_odometer: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;

  const updateField = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.make) newErrors['make'] = 'Required';
      if (!formData.model) newErrors['model'] = 'Required';
      if (!formData.model_year) newErrors['model_year'] = 'Required';
      if (!formData.vehicle_category) newErrors['vehicle_category'] = 'Required';
      if (!formData.fuel_type) newErrors['fuel_type'] = 'Required';
      if (!formData.transmission) newErrors['transmission'] = 'Required';
      if (!formData.plate_number) newErrors['plate_number'] = 'Required';
    } else if (step === 2) {
      if (!formData.owner_name) newErrors['owner_name'] = 'Required';
      if (!formData.owner_phone) newErrors['owner_phone'] = 'Required';
      if (!formData.usage_type) newErrors['usage_type'] = 'Required';
      if (!formData.load_type) newErrors['load_type'] = 'Required';
    } else if (step === 3) {
      if (!formData.current_mileage) newErrors['current_mileage'] = 'Required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitForm = () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    
    const ga = new (window as any).GlideAjax('AAYOSVehicleRegistration');
    ga.addParam('sysparm_name', 'createVehicle');
    ga.addParam('sysparm_data', JSON.stringify(formData));
    ga.getXML(function(response: any) {
      setLoading(false);
      const answer = response.responseXML.documentElement.getAttribute('answer');
      const result = JSON.parse(answer);
      
      if (result.success) {
        alert('Vehicle registered successfully! Vehicle ID: ' + result.vehicle_id);
        window.location.href = '/x_1868112_aayos_vehicles.do';
      } else {
        alert('Error: ' + result.error);
      }
    });
  };

  const renderStepIndicator = () => {
    const steps = [1, 2, 3, 4];
    const stepElements = steps.map(step => {
      const isActive = step <= currentStep;
      const isCurrent = step === currentStep;
      const isPast = step < currentStep;
      
      let bgColor = 'white';
      if (isPast) bgColor = '#e8f5e9';
      if (isCurrent) bgColor = '#e3f2fd';
      
      let borderColor = '#e0e0e0';
      if (isActive) borderColor = '#1976d2';
      
      let textColor = '#999';
      if (isActive) textColor = '#1976d2';

      return React.createElement('div', {
        key: step,
        style: {
              position: 'relative',
              zIndex: 1,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
          border: '2px solid ' + borderColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
          color: textColor,
          background: bgColor
        }
      }, step);
    });

    return React.createElement('div', {
      style: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }
    }, [
      React.createElement('div', {
        key: 'line',
        style: { position: 'absolute', top: '20px', left: 0, right: 0, height: '2px', background: '#e0e0e0', zIndex: 0 }
      }),
      ...stepElements
    ]);
  };

  const getBorderStyle = (hasError: boolean) => {
    if (hasError) return '1px solid #d32f2f';
    return '1px solid #ddd';
  };

  const getCursorStyle = (disabled: boolean) => {
    if (disabled) return 'not-allowed';
    return 'pointer';
  };

  const getOpacityStyle = (disabled: boolean) => {
    if (disabled) return 0.6;
    return 1;
  };

  const renderStep1 = () => {
    const makeInput = React.createElement('input', {
      type: 'text',
      value: formData.make,
      onChange: (e: any) => updateField('make', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.make), borderRadius: '4px' }
    });

    const modelInput = React.createElement('input', {
      type: 'text',
      value: formData.model,
      onChange: (e: any) => updateField('model', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.model), borderRadius: '4px' }
    });

    const yearInput = React.createElement('input', {
      type: 'number',
      value: formData.model_year,
      onChange: (e: any) => updateField('model_year', e.target.value),
      min: '1900',
      max: '2100',
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.model_year), borderRadius: '4px' }
    });

    const categoryOptions = [
      { value: '', label: 'Select...' },
      { value: 'sedan', label: 'Sedan' },
      { value: 'suv', label: 'SUV' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'van', label: 'Van' },
      { value: 'truck', label: 'Truck' },
      { value: 'hatchback', label: 'Hatchback' },
      { value: 'coupe', label: 'Coupe' },
      { value: 'convertible', label: 'Convertible' },
      { value: 'motorcycle', label: 'Motorcycle' },
      { value: 'other', label: 'Other' }
    ];

    const categorySelect = React.createElement('select', {
      value: formData.vehicle_category,
      onChange: (e: any) => updateField('vehicle_category', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.vehicle_category), borderRadius: '4px' }
    }, categoryOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    const fuelOptions = [
      { value: '', label: 'Select...' },
      { value: 'petrol', label: 'Petrol' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'ev', label: 'Electric Vehicle (EV)' },
      { value: 'cng', label: 'CNG' },
      { value: 'lpg', label: 'LPG' }
    ];

    const fuelSelect = React.createElement('select', {
      value: formData.fuel_type,
      onChange: (e: any) => updateField('fuel_type', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.fuel_type), borderRadius: '4px' }
    }, fuelOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    const transmissionOptions = [
      { value: '', label: 'Select...' },
      { value: 'manual', label: 'Manual' },
      { value: 'automatic', label: 'Automatic' },
      { value: 'cvt', label: 'CVT' },
      { value: 'semi_automatic', label: 'Semi-Automatic' }
    ];

    const transmissionSelect = React.createElement('select', {
      value: formData.transmission,
      onChange: (e: any) => updateField('transmission', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.transmission), borderRadius: '4px' }
    }, transmissionOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    const vinInput = React.createElement('input', {
      type: 'text',
      value: formData.vin,
      onChange: (e: any) => updateField('vin', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const plateInput = React.createElement('input', {
      type: 'text',
      value: formData.plate_number,
      onChange: (e: any) => updateField('plate_number', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.plate_number), borderRadius: '4px' }
    });

    return React.createElement('div', null, [
      React.createElement('h2', { key: 'title' }, 'Step 1: Basic Vehicle Information'),
      React.createElement('div', {
        key: 'row1',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'make' }, [
          React.createElement('label', { key: 'label' }, ['Make ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          makeInput,
          (() => {
            if (errors.make) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.make);
            }
            return null;
          })()
        ]),
        React.createElement('div', { key: 'model' }, [
          React.createElement('label', { key: 'label' }, ['Model ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          modelInput,
          (() => {
            if (errors.model) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.model);
            }
            return null;
          })()
        ])
      ]),
      React.createElement('div', {
        key: 'row2',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'year' }, [
          React.createElement('label', { key: 'label' }, ['Model Year ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          yearInput,
          (() => {
            if (errors.model_year) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.model_year);
            }
            return null;
          })()
        ]),
        React.createElement('div', { key: 'category' }, [
          React.createElement('label', { key: 'label' }, ['Vehicle Category ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          categorySelect,
          (() => {
            if (errors.vehicle_category) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.vehicle_category);
            }
            return null;
          })()
        ])
      ]),
      React.createElement('div', {
        key: 'row3',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'fuel' }, [
          React.createElement('label', { key: 'label' }, ['Fuel Type ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          fuelSelect,
          (() => {
            if (errors.fuel_type) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.fuel_type);
            }
            return null;
          })()
        ]),
        React.createElement('div', { key: 'transmission' }, [
          React.createElement('label', { key: 'label' }, ['Transmission ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          transmissionSelect,
          (() => {
            if (errors.transmission) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.transmission);
            }
            return null;
          })()
        ])
      ]),
      React.createElement('div', {
        key: 'row4',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'vin' }, [
          React.createElement('label', { key: 'label' }, 'VIN'),
          vinInput
        ]),
        React.createElement('div', { key: 'plate' }, [
          React.createElement('label', { key: 'label' }, ['Plate Number ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          plateInput,
          (() => {
            if (errors.plate_number) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.plate_number);
            }
            return null;
          })()
        ])
      ])
    ]);
  };

  const renderStep2 = () => {
    const ownerNameInput = React.createElement('input', {
      type: 'text',
      value: formData.owner_name,
      onChange: (e: any) => updateField('owner_name', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.owner_name), borderRadius: '4px' }
    });

    const ownerPhoneInput = React.createElement('input', {
      type: 'text',
      value: formData.owner_phone,
      onChange: (e: any) => updateField('owner_phone', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.owner_phone), borderRadius: '4px' }
    });

    const ownerEmailInput = React.createElement('input', {
      type: 'email',
      value: formData.owner_email,
      onChange: (e: any) => updateField('owner_email', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const usageOptions = [
      { value: '', label: 'Select...' },
      { value: 'daily_commute', label: 'Daily Commute' },
      { value: 'city_stop_go', label: 'City Stop & Go' },
      { value: 'highway_long_distance', label: 'Highway Long Distance' },
      { value: 'mixed_use', label: 'Mixed Use' },
      { value: 'commercial_delivery', label: 'Commercial Delivery' },
      { value: 'commercial_taxi', label: 'Commercial Taxi' },
      { value: 'public_transport', label: 'Public Transport' },
      { value: 'off_road', label: 'Off Road' },
      { value: 'heavy_duty', label: 'Heavy Duty' },
      { value: 'low_usage', label: 'Low Usage' },
      { value: 'high_performance', label: 'High Performance' }
    ];

    const usageSelect = React.createElement('select', {
      value: formData.usage_type,
      onChange: (e: any) => updateField('usage_type', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.usage_type), borderRadius: '4px' }
    }, usageOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    const loadOptions = [
      { value: '', label: 'Select...' },
      { value: 'light_load', label: 'Light Load' },
      { value: 'normal_load', label: 'Normal Load' },
      { value: 'heavy_load', label: 'Heavy Load' },
      { value: 'variable_load', label: 'Variable Load' },
      { value: 'passenger_heavy', label: 'Passenger Heavy' },
      { value: 'cargo_transport', label: 'Cargo Transport' },
      { value: 'towing', label: 'Towing' }
    ];

    const loadSelect = React.createElement('select', {
      value: formData.load_type,
      onChange: (e: any) => updateField('load_type', e.target.value),
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.load_type), borderRadius: '4px' }
    }, loadOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    const conditionOptions = [
      { value: 'tropical', label: 'Tropical' },
      { value: 'cold', label: 'Cold' },
      { value: 'desert', label: 'Desert' },
      { value: 'rough_roads', label: 'Rough Roads' },
      { value: 'mixed', label: 'Mixed' }
    ];

    const conditionSelect = React.createElement('select', {
      value: formData.driving_condition_profile,
      onChange: (e: any) => updateField('driving_condition_profile', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    }, conditionOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    const tcuOptions = [
      { value: 'false', label: 'No' },
      { value: 'true', label: 'Yes' }
    ];

    const tcuSelect = React.createElement('select', {
      value: formData.has_tcu,
      onChange: (e: any) => updateField('has_tcu', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    }, tcuOptions.map(opt => React.createElement('option', { key: opt.value, value: opt.value }, opt.label)));

    return React.createElement('div', null, [
      React.createElement('h2', { key: 'title' }, 'Step 2: Owner & Usage Information'),
      React.createElement('div', {
        key: 'row1',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'name' }, [
          React.createElement('label', { key: 'label' }, ['Owner Name ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          ownerNameInput,
          (() => {
            if (errors.owner_name) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.owner_name);
            }
            return null;
          })()
        ]),
        React.createElement('div', { key: 'phone' }, [
          React.createElement('label', { key: 'label' }, ['Owner Phone ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          ownerPhoneInput,
          (() => {
            if (errors.owner_phone) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.owner_phone);
            }
            return null;
          })()
        ])
      ]),
      React.createElement('div', {
        key: 'email',
        style: { marginBottom: '20px' }
      }, [
        React.createElement('label', { key: 'label' }, 'Owner Email'),
        ownerEmailInput
      ]),
      React.createElement('div', {
        key: 'row2',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'usage' }, [
          React.createElement('label', { key: 'label' }, ['Usage Type ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          usageSelect,
          (() => {
            if (errors.usage_type) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.usage_type);
            }
            return null;
          })()
        ]),
        React.createElement('div', { key: 'load' }, [
          React.createElement('label', { key: 'label' }, ['Load Type ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          loadSelect,
          (() => {
            if (errors.load_type) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.load_type);
            }
            return null;
          })()
        ])
      ]),
      React.createElement('div', {
        key: 'condition',
        style: { marginBottom: '20px' }
      }, [
        React.createElement('label', { key: 'label' }, 'Driving Condition Profile'),
        conditionSelect
      ]),
      React.createElement('div', {
        key: 'row3',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'tcu' }, [
          React.createElement('label', { key: 'label' }, 'Has TCU (Telematics)'),
          tcuSelect
        ])
      ])
    ]);
  };

  const renderStep3 = () => {
    const mileageInput = React.createElement('input', {
      type: 'number',
      value: formData.current_mileage,
      onChange: (e: any) => updateField('current_mileage', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: getBorderStyle(!!errors.current_mileage), borderRadius: '4px' }
    });

    const monthlyMileageInput = React.createElement('input', {
      type: 'number',
      value: formData.estimated_monthly_mileage,
      onChange: (e: any) => updateField('estimated_monthly_mileage', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const serviceDateInput = React.createElement('input', {
      type: 'date',
      value: formData.last_service_date,
      onChange: (e: any) => updateField('last_service_date', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const serviceOdometerInput = React.createElement('input', {
      type: 'number',
      value: formData.last_service_odometer,
      onChange: (e: any) => updateField('last_service_odometer', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const oilDateInput = React.createElement('input', {
      type: 'date',
      value: formData.last_oil_change_date,
      onChange: (e: any) => updateField('last_oil_change_date', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const oilOdometerInput = React.createElement('input', {
      type: 'number',
      value: formData.last_oil_change_odometer,
      onChange: (e: any) => updateField('last_oil_change_odometer', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const brakeDateInput = React.createElement('input', {
      type: 'date',
      value: formData.last_brake_service_date,
      onChange: (e: any) => updateField('last_brake_service_date', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const brakeOdometerInput = React.createElement('input', {
      type: 'number',
      value: formData.last_brake_service_odometer,
      onChange: (e: any) => updateField('last_brake_service_odometer', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const tireDateInput = React.createElement('input', {
      type: 'date',
      value: formData.last_tire_service_date,
      onChange: (e: any) => updateField('last_tire_service_date', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const tireOdometerInput = React.createElement('input', {
      type: 'number',
      value: formData.last_tire_service_odometer,
      onChange: (e: any) => updateField('last_tire_service_odometer', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const batteryDateInput = React.createElement('input', {
      type: 'date',
      value: formData.last_battery_service_date,
      onChange: (e: any) => updateField('last_battery_service_date', e.target.value),
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    const batteryOdometerInput = React.createElement('input', {
      type: 'number',
      value: formData.last_battery_service_odometer,
      onChange: (e: any) => updateField('last_battery_service_odometer', e.target.value),
      min: '0',
      style: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }
    });

    return React.createElement('div', null, [
      React.createElement('h2', { key: 'title' }, 'Step 3: Service History & Mileage'),
      React.createElement('div', {
        key: 'row1',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'mileage' }, [
          React.createElement('label', { key: 'label' }, ['Current Mileage (km) ', React.createElement('span', { key: 'req', style: { color: '#d32f2f' } }, '*')]),
          mileageInput,
          (() => {
            if (errors.current_mileage) {
              return React.createElement('span', { key: 'error', style: { color: '#d32f2f', fontSize: '12px' } }, errors.current_mileage);
            }
            return null;
          })()
        ]),
        React.createElement('div', { key: 'monthly' }, [
          React.createElement('label', { key: 'label' }, 'Estimated Monthly Mileage (km)'),
          monthlyMileageInput
        ])
      ]),
      React.createElement('h3', { key: 'serviceTitle' }, 'Last Service Dates'),
      React.createElement('div', {
        key: 'row2',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'serviceDate' }, [
          React.createElement('label', { key: 'label' }, 'Last General Service Date'),
          serviceDateInput
        ]),
        React.createElement('div', { key: 'serviceOdometer' }, [
          React.createElement('label', { key: 'label' }, 'Last General Service Odometer (km)'),
          serviceOdometerInput
        ])
      ]),
      React.createElement('div', {
        key: 'row3',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'oilDate' }, [
          React.createElement('label', { key: 'label' }, 'Last Oil Change Date'),
          oilDateInput
        ]),
        React.createElement('div', { key: 'oilOdometer' }, [
          React.createElement('label', { key: 'label' }, 'Last Oil Change Odometer (km)'),
          oilOdometerInput
        ])
      ]),
      React.createElement('div', {
        key: 'row4',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'brakeDate' }, [
          React.createElement('label', { key: 'label' }, 'Last Brake Service Date'),
          brakeDateInput
        ]),
        React.createElement('div', { key: 'brakeOdometer' }, [
          React.createElement('label', { key: 'label' }, 'Last Brake Service Odometer (km)'),
          brakeOdometerInput
        ])
      ]),
      React.createElement('div', {
        key: 'row5',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'tireDate' }, [
          React.createElement('label', { key: 'label' }, 'Last Tire Service Date'),
          tireDateInput
        ]),
        React.createElement('div', { key: 'tireOdometer' }, [
          React.createElement('label', { key: 'label' }, 'Last Tire Service Odometer (km)'),
          tireOdometerInput
        ])
      ]),
      React.createElement('div', {
        key: 'row6',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }
      }, [
        React.createElement('div', { key: 'batteryDate' }, [
          React.createElement('label', { key: 'label' }, 'Last Battery Service Date'),
          batteryDateInput
        ]),
        React.createElement('div', { key: 'batteryOdometer' }, [
          React.createElement('label', { key: 'label' }, 'Last Battery Service Odometer (km)'),
          batteryOdometerInput
        ])
      ])
    ]);
  };

  const renderStep4 = () => {
    return React.createElement('div', null, [
      React.createElement('h2', { key: 'title' }, 'Step 4: Review & Submit'),
      React.createElement('p', { key: 'desc' }, 'Please review all information before submitting.'),
      React.createElement('div', {
        key: 'vehicleInfo',
        style: { background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '15px' }
      }, [
        React.createElement('h3', { key: 'h3', style: { marginTop: 0, color: '#1976d2' } }, 'Vehicle Information'),
        React.createElement('div', {
          key: 'row1',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Make/Model:'),
          React.createElement('span', { key: 'value' }, formData.make + ' ' + formData.model)
        ]),
        React.createElement('div', {
          key: 'row2',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Year:'),
          React.createElement('span', { key: 'value' }, formData.model_year)
        ]),
        React.createElement('div', {
          key: 'row3',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Category:'),
          React.createElement('span', { key: 'value' }, formData.vehicle_category)
        ]),
        React.createElement('div', {
          key: 'row4',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Plate Number:'),
          React.createElement('span', { key: 'value' }, formData.plate_number)
        ])
      ]),
      React.createElement('div', {
        key: 'ownerInfo',
        style: { background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '15px' }
      }, [
        React.createElement('h3', { key: 'h3', style: { marginTop: 0, color: '#1976d2' } }, 'Owner Information'),
        React.createElement('div', {
          key: 'row1',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Owner Name:'),
          React.createElement('span', { key: 'value' }, formData.owner_name)
        ]),
        React.createElement('div', {
          key: 'row2',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Phone:'),
          React.createElement('span', { key: 'value' }, formData.owner_phone)
        ]),
        React.createElement('div', {
          key: 'row3',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Email:'),
          React.createElement('span', { key: 'value' }, formData.owner_email || 'N/A')
        ])
      ]),
      React.createElement('div', {
        key: 'usageInfo',
        style: { background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '15px' }
      }, [
        React.createElement('h3', { key: 'h3', style: { marginTop: 0, color: '#1976d2' } }, 'Usage & Mileage'),
        React.createElement('div', {
          key: 'row1',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Usage Type:'),
          React.createElement('span', { key: 'value' }, formData.usage_type)
        ]),
        React.createElement('div', {
          key: 'row2',
          style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: 500, color: '#666' } }, 'Current Mileage:'),
          React.createElement('span', { key: 'value' }, (formData.current_mileage || '0') + ' km')
        ])
      ])
    ]);
  };

  const renderCurrentStep = () => {
    if (currentStep === 1) return renderStep1();
    if (currentStep === 2) return renderStep2();
    if (currentStep === 3) return renderStep3();
    if (currentStep === 4) return renderStep4();
    return null;
  };

  const renderButtons = () => {
    const isPrevDisabled = currentStep === 1;
    const prevButton = React.createElement('button', {
      onClick: prevStep,
      disabled: isPrevDisabled,
      style: {
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: getCursorStyle(isPrevDisabled),
              fontWeight: 500,
              background: '#757575',
              color: 'white',
              opacity: getOpacityStyle(isPrevDisabled)
      }
    }, 'Previous');

    let nextButton;
    if (currentStep < totalSteps) {
      nextButton = React.createElement('button', {
        onClick: nextStep,
        style: {
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 500,
                background: '#1976d2',
                color: 'white'
        }
      }, 'Next');
    } else {
      let buttonText = 'Register Vehicle';
      if (loading) buttonText = 'Saving...';
      
      nextButton = React.createElement('button', {
        onClick: submitForm,
        disabled: loading,
        style: {
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: getCursorStyle(loading),
                fontWeight: 500,
                background: '#1976d2',
                color: 'white',
                opacity: getOpacityStyle(loading)
        }
      }, buttonText);
    }

    return React.createElement('div', {
      style: { marginTop: '30px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }
    }, [prevButton, nextButton]);
  };

  return React.createElement('div', {
    style: { fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: '20px', background: '#f5f5f5', minHeight: '100vh' }
  }, [
    React.createElement('div', {
      key: 'container',
      style: { maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '30px' }
    }, [
      React.createElement('div', {
        key: 'header',
        style: { textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e0e0e0' }
      }, [
        React.createElement('h1', { key: 'title', style: { margin: 0, color: '#333' } }, 'Register New Vehicle'),
        React.createElement('p', { key: 'subtitle' }, 'Complete all steps to register a vehicle in AAYOS')
      ]),
      renderStepIndicator(),
      renderCurrentStep(),
      renderButtons()
    ])
  ]);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    React.createElement(React.StrictMode, null,
      React.createElement(VehicleRegister, null)
    )
  );
}
