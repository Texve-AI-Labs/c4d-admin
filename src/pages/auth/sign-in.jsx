import React, { useEffect, useState } from 'react';
import {
  Card,
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '@/context/auth';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from "@/utils/constants";
import { FirebaseMessaging, requestToken } from "@/configs/firebaseConfig";
// import { setUser } from '../redux/store';
// import { useDispatch} from 'react-redux';


export function SignIn() {
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  // const dispatch = useDispatch();


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));

    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '' });
    try {
      let deviceToken = await requestToken();
      let obj = { ...newUser, deviceToken };
      const response = await ApiRequestUtils.post(API_ROUTES.USER_LOGIN, obj);
      if (response.success == false) {
        if (response.error === "User not found") {
          setErrors(prev => ({ ...prev, email: "User not found" }));
        } else if (response.error === "Invalid credentials") {
          setErrors(prev => ({ ...prev, password: "Invalid credentials" }));
        }
       else if (response.error === "User account is inactive.") {
        setErrors(prev => ({...prev, email: "User account is inactive.", password: ""}));
      }
        return;
      }

      if (response.code) {
        login(response.code, response.user);

        setNewUser({
          email: '',
          password: ''
        });

        // const responseData1 = {
        //   user: {
        //     name: 'John Doe',
        //     role: 'sales', // Role is not important here
        //   },
        //   permissions: ['Home','Customers','Users'], // Example permissions array
        // };
        // dispatch(setUser({ user: responseData1.user, permissions: responseData1.permissions }));

        navigate('/dashboard/booking');
      }
    } catch (error) {
      setErrors({
        email: "An error occured. Please try again.",
        password: ""
      });
    }
  };

  const inputErrorClasses = (fieldName) => `
    !border-t-blue-gray-200 
    focus:!border-t-gray-900
    ${errors[fieldName] ? '!border-red-500 !border-2 focus:!border-red-500' : ''}
  `;

  const inputStyles = (fieldName) => ({
    container: {
      className: "min-w-[100px]",
    },
    input: {
      className: errors[fieldName]
        ? "!border-red-500 focus:!border-red-500 ring-1 ring-red-500/20"
        : "!border-blue-gray-200 focus:!border-gray-900",
      labelProps: {
        className: errors[fieldName]
          ? "!text-red-500 peer-focus:!text-red-500"
          : "text-blue-gray-400 peer-focus:text-gray-900",
      }
    }
  });

  return (
    <section className="m-8 flex gap-4">
      <div className="w-full mt-10">
        <div className="text-center">
          <img
            src="/img/app_icon_root.png"
            alt="Root Cabs"
            className="mx-auto mb-4 rounded-full"
            style={{ maxHeight: '100px' }}
          />
          <Typography variant="h2" className="font-bold mb-4">Sign In</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">Enter your email and password to Sign In.</Typography>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
          <div className="mb-1 flex flex-col gap-6">
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Your email
            </Typography>
            <Input
              size="lg"
              placeholder="name@mail.com"
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              containerProps={inputStyles('email').container}
              variant="outlined"
              name='email'
              value={newUser.email}
              onChange={handleInputChange}
              error={!!errors.email}
              {...inputStyles('email').input}
            />
            {errors.email && (
              <Typography variant="small" color="red" className="-mt-5 text-red-500 text-base font-medium">{errors.email}</Typography>
            )}
            <Typography variant="small" color="blue-gray" className="-mb-3 font-medium">
              Password
            </Typography>
            <Input
              type="password"
              size="lg"
              placeholder="********"
              value={newUser.password}
              onChange={handleInputChange}
              name='password'
              labelProps={{
                className: "before:content-none after:content-none",
              }}
              containerProps={inputStyles('password').container}
              error={!!errors.password}
              {...inputStyles('password').input}
              variant="outlined"
            />
            {errors.password && (
              <Typography variant="small" color="red" className="-mt-5 text-red-500 text-base font-medium">{errors.password}</Typography>
            )}
          </div>
          {/* <Checkbox
            label={
              <Typography
                variant="small"
                color="gray"
                className="flex items-center justify-start font-medium"
              >
                I agree the&nbsp;
                <a
                  href="#"
                  className="font-normal text-black transition-colors hover:text-gray-900 underline"
                >
                  Terms and Conditions
                </a>
              </Typography>
            }
            containerProps={{ className: "-ml-2.5" }}
          /> */}
          <Button className="mt-6" fullWidth type="submit" >
            Sign In
          </Button>

          {/* <div className="flex items-center justify-between gap-2 mt-6">
            <Typography variant="small" className="font-medium text-gray-900">
              <a href="#">
                Forgot Password
              </a>
            </Typography>
          </div> */}
        </form>

      </div>
      {/* <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
        />
      </div> */}

    </section>
  );
}

export default SignIn;
