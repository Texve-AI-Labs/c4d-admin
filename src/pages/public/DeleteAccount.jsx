import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Typography,
  Alert,
} from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

export function DeleteAccount() {
  const rootLogo = "/img/Root-Cabs-Logo.png";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1); // 1: phone input, 2: OTP input, 3: confirmation, 4: success

  useEffect(() => {
    handleStartSession();
  }, []);

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ApiRequestUtils.get("/session/start", {
        phoneNumber: phoneNumber
      });
      setLoading(false);
      // console.log("Session response:", response);
      if (response.sid) {
        setSessionId(response.sid);
      } else {
        throw new Error("Failed to start session");
      }
    } catch (err) {
      setError(err.message || "Failed to start session");
      setLoading(false);
    }
  };

  const handleMobileVerification = async () => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.post("/verify", {
        phoneNumber: '+91' + phoneNumber,
        sessionId: sessionId,
        user: "USER"
      });
      
      if (response.success) {
        setStep(2);
      } else {
        throw new Error("Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      const response = await ApiRequestUtils.post("/otp-verify", {
        otp: parseInt(otp, 10),
        sessionId: sessionId,
        phoneNumber: phoneNumber,
        deviceToken: token
      });
      console.log("OTP verification response:", response);
      if (response.success || response ==='') {
        setStep(3);
      } 
      // else {
      //   throw new Error("Invalid OTP");
      // }
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await ApiRequestUtils.delete("/delete-my-account", {
        sessionId: sessionId,
        phoneNumber: phoneNumber
      });
      
      if (response.success) {
        setSuccess("Your account has been successfully deleted.");
        setStep(4);
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (err) {
      setError(err.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-secondary to-primary-900">
      {/* Header */}
      <div className="w-full bg-white shadow-md">
        <div className="container mx-auto px-4 py-2">
          <img src={rootLogo} alt="Root Cabs" className="h-16" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex items-center justify-center p-4 pt-8">
        <Card className="w-full max-w-[450px]">
          <CardHeader
            variant="filled"
            color="blue"
            className="mb-4 grid h-20 place-items-center bg-secondary"
          >
            <Typography variant="h3" color="white">
              Delete Account
            </Typography>
          </CardHeader>

          <CardBody className="flex flex-col gap-4">
            {error && (
              <Alert
                variant="filled"
                color="red"
                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                variant="filled"
                color="green"
              >
                {success}
              </Alert>
            )}

            {step === 1 && (
              <>
                <Typography variant="h6" color="blue-gray">
                  Enter your mobile number to proceed
                </Typography>
                <Input
                  size="lg"
                  label="Mobile Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
                <Button
                  className="bg-secondary"
                  onClick={handleMobileVerification}
                  disabled={loading || phoneNumber.length !== 10}
                  fullWidth
                >
                  {loading ? "Sending OTP..." : "Get OTP"}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Typography variant="h6" color="blue-gray">
                  Enter the OTP sent to your mobile
                </Typography>
                <Input
                  size="lg"
                  label="OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                />
                <Button
                  className="bg-secondary"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 4}
                  fullWidth
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <Typography variant="h6" color="blue-gray" className="text-center">
                  Are you sure you want to delete your account?
                </Typography>
                <Typography color="gray" className="text-center">
                  This action cannot be undone.
                </Typography>
                <div className="flex gap-4">
                  <Button
                    variant="outlined"
                    color="blue-gray"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-500"
                    onClick={handleConfirmDelete}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
              </>
            )}

            {step === 4 && (
              <Typography variant="h6" color="blue-gray" className="text-center">
                Your account has been deleted successfully.
              </Typography>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
