import React, { SFC } from 'react';
import Modal from '@/components/Modal';
import { Formik } from 'formik';
import { login } from '@/services/auth';
import history from '@/utils/history';

const handleFormValidate = () => ({});

const handleFormSubmit = async (values: any, actions: any) => {
  const res = await login(values);

  if (res.error) {
    actions.setStatus({  msg: res.error });
  } else if (res.token) {
    localStorage.setItem('token', res.token);
    history.push('/clients');
  } else {
    actions.setStatus({  msg: 'Unexpected error' });
  }

  actions.setSubmitting(false);
};

const renderLoginForm = ({
  values,
  errors,
  status,
  handleChange,
  handleSubmit,
  isSubmitting,
  setFieldValue,
}: any) => (
  <form
    className="max-w-md m-auto"
    onSubmit={handleSubmit}
  >
    <div className="mb-2">
      <label className="text-xs font-bold text-grey-darker">Email</label>
      <div>
        <input
          className="border-b block w-full py-2 px-3"
          type="text"
          name="email"
          value={values.email}
          onChange={handleChange}
        />
      </div>
    </div>

    <div className="my-2">
      <label className="text-xs font-bold text-grey-darker">Password</label>
      <div>
        <input
          className="border-b block w-full py-2 px-3"
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
        />
      </div>
    </div>

    <div className="my-2">
      {status && status.msg && <div className="text-red text-center">{status.msg}</div>}
    </div>

    <div className="mt-6 text-right">
      <button type="submit" className="button button-primary" disabled={isSubmitting}>Submit</button>
    </div>
  </form>
);

interface LoginFormProps {

}

const LoginForm: SFC<LoginFormProps> = props => (
  <Modal>
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      validate={handleFormValidate}
      onSubmit={handleFormSubmit}
      render={renderLoginForm}
    />
  </Modal>
);

export default LoginForm;
