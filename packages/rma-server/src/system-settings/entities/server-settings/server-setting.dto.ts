import {
  IsUrl,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServerSettingsDto {
  uuid?: string;

  @IsNotEmpty()
  @IsUrl()
  @ApiProperty({
    description: 'The URL of the server.',
    type: 'string',
    required: true,
  })
  appURL: string;

  @IsNotEmpty()
  @IsUrl()
  @ApiProperty({
    description: 'The URL of the frappe-server.',
    type: 'string',
    required: true,
  })
  authServerURL: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'The clientId of the front-end client on frappe.',
    type: 'string',
    required: true,
  })
  frontendClientId: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'The clientId of the back-end client on frappe..',
    type: 'string',
    required: true,
  })
  backendClientId: string;

  @IsString({ each: true })
  @ApiProperty({
    description: 'Scopes on OAuth2 client',
    type: 'string',
    required: true,
  })
  scope: string[];

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The callback protocol for mobile app.',
    type: 'string',
    required: true,
  })
  callbackProtocol: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'The uuid for client-token.',
    type: 'string',
    required: true,
  })
  clientTokenUuid: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Service account',
    type: 'string',
    required: true,
  })
  serviceAccountUser: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Service account secret',
    type: 'string',
    required: true,
  })
  serviceAccountSecret: string;

  @IsOptional()
  @ApiProperty({
    description: 'API Key to be used from frappe webhook',
    type: 'string',
    required: true,
  })
  webhookApiKey: string;

  @IsOptional()
  @ApiProperty({
    description: 'Default Company for app from ERPNext',
    type: 'string',
    required: true,
  })
  defaultCompany: string;

  @IsOptional()
  @ApiProperty({
    description: 'Selling Price List from ERPNext',
    type: 'string',
    required: true,
  })
  sellingPriceList: string;
}
