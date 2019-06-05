import React, { Component } from 'react';
import { Input, Form } from 'antd';
import { observer, inject } from 'mobx-react';
import intl from 'react-intl-universal';

const FormItem = Form.Item;
const EditableContext = React.createContext();
const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
);
export const EditableFormRow = Form.create()(EditableRow);

@inject(stores => ({
  language: stores.languageIntl.language,
}))

@observer
export class EditableCell extends Component {
  state = {
    editing: false,
  }

  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
      }
    });
  }

  save = e => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error, values) => {
      if (error && error[e.currentTarget.id]) {
        values = {};
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  }

  render() {
    const { editing } = this.state;
    const { editable, dataIndex, title, record, index, handleSave, ...restProps } = this.props;
    return (
      <td {...restProps}>
        {editable ? 
          <EditableContext.Consumer>
          {form => {
            this.form = form;
            return (
              editing ? (
                <FormItem style={{ margin: 0 }}>
                  {form.getFieldDecorator(dataIndex, {
                    rules: [{
                      required: true,
                      message: intl.get('Rename.name'),
                    }],
                    initialValue: record[dataIndex],
                  })(
                    <Input
                      style={{ width: '300px' }}
                      ref={node => (this.input = node)}
                      onPressEnter={this.save}
                      onBlur={this.save}
                    />
                  )}
                </FormItem>
              ) : (
                <div
                  className="editable-cell-value-wrap"
                  style={{ paddingRight: 24 }}
                  onClick={this.toggleEdit}
                >
                  {restProps.children}
                </div>
              )
            );
          }}
        </EditableContext.Consumer>
         : restProps.children}
      </td>
    );
  }
}