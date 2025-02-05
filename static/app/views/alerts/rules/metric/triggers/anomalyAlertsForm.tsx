import {Component, Fragment} from 'react';
import styled from '@emotion/styled';

import SelectControl from 'sentry/components/forms/controls/selectControl';
import FieldGroup from 'sentry/components/forms/fieldGroup';
import {
  AlertRuleSensitivity,
  AlertRuleThresholdType,
  type UnsavedMetricRule,
} from 'sentry/views/alerts/rules/metric/types';

type Props = {
  disabled: boolean;
  onSensitivityChange: (sensitivity: AlertRuleSensitivity) => void;
  onThresholdTypeChange: (thresholdType: AlertRuleThresholdType) => void;
  sensitivity: UnsavedMetricRule['sensitivity'];
  thresholdType: UnsavedMetricRule['thresholdType'];
  /**
   * Map of fieldName -> errorMessage
   */
  error?: {[fieldName: string]: string};

  hideControl?: boolean;
};

type SensitivityFormItemProps = {
  onSensitivityChange: (sensitivity: AlertRuleSensitivity) => void;
  sensitivity: UnsavedMetricRule['sensitivity'];
};

type DirectionFormItemProps = {
  onThresholdTypeChange: (thresholdType: AlertRuleThresholdType) => void;
  thresholdType: UnsavedMetricRule['thresholdType'];
};

function SensitivityFormItem({
  sensitivity,
  onSensitivityChange,
}: SensitivityFormItemProps) {
  return (
    <StyledField
      label={'Sensitivity'}
      id={'sensitivity'}
      help={
        'Lower sensitivity will alert you only when anomalies are larger, higher sensitivity will alert you and your team for even small deviations.'
      }
      required
    >
      <SelectContainer>
        <SelectControl
          name="sensitivity"
          inputId={'sensitivity'}
          value={sensitivity}
          options={[
            {
              value: AlertRuleSensitivity.LOW,
              label: 'Low (alert less often)',
            },
            {
              value: AlertRuleSensitivity.MEDIUM,
              label: 'Medium',
            },
            {
              value: AlertRuleSensitivity.HIGH,
              label: 'High (alert more often)',
            },
          ]}
          onChange={({value}) => {
            onSensitivityChange(value);
          }}
        />
      </SelectContainer>
    </StyledField>
  );
}

function DirectionFormItem({
  thresholdType,
  onThresholdTypeChange,
}: DirectionFormItemProps) {
  return (
    <StyledField
      label={'Direction'}
      help={
        'Indicate if you want to be alerted of anomalies above your set bounds, below, or both.'
      }
      required
    >
      <SelectContainer>
        <SelectControl
          name="sensitivity"
          value={thresholdType}
          options={[
            {
              value: AlertRuleThresholdType.ABOVE_AND_BELOW,
              label: 'Above and below bounds',
            },
            {
              value: AlertRuleThresholdType.ABOVE,
              label: 'Above bounds only',
            },
            {
              value: AlertRuleThresholdType.BELOW,
              label: 'Below bounds only',
            },
          ]}
          onChange={({value}) => {
            onThresholdTypeChange(value);
          }}
        />
      </SelectContainer>
    </StyledField>
  );
}

class AnomalyDetectionFormField extends Component<Props> {
  render() {
    const {sensitivity, onSensitivityChange, thresholdType, onThresholdTypeChange} =
      this.props;

    return (
      <Fragment>
        <SensitivityFormItem
          sensitivity={sensitivity}
          onSensitivityChange={onSensitivityChange}
        />
        <DirectionFormItem
          thresholdType={thresholdType}
          onThresholdTypeChange={onThresholdTypeChange}
        />
      </Fragment>
    );
  }
}

const StyledField = styled(FieldGroup)`
  & > label > div:first-child > span {
    display: flex;
    flex-direction: row;
  }
`;

const SelectContainer = styled('div')`
  flex: 1;
`;
export default AnomalyDetectionFormField;
