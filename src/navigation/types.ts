import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Route parameter definition for Auth Stack
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/**
 * Route parameter definition for authenticated App Stack
 */
export type AppStackParamList = {
  Home: undefined;
  Details: { itemId: string; title: string } | undefined;
  Camera: undefined;
  AddContactGroup: undefined;
  EditContactGroup: { id: number | string };
  ContactList: { id: number | string };
  AddMailTemplate: undefined;
  EditMailTemplate: { id: number | string };

  PreviewExtracted: {
    data: {
      fields: Array<{
        name?: string;
        email?: string;
        company_name?: string;
        mobile_number?: string;
        address?: string;
      }>;
      image?: string;
    };
  };
  PreviewSend: {
    contacts: Array<{
      id: string;
      name: string;
      email: string;
      companyName: string;
      mobileNumber: string;
      address: string;
    }>;
    template: {
      id: number;
      name: string;
      subject: string;
      content: string;
    };
    clickToConnectId?: number | string;
  };
};

/**
 * Route parameter definition for overall Root Stack
 */
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// Strongly-typed screen prop generators
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppStackScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Navigation handles types for screen controllers
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
