import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../graphql/types/user.type';

@InputType()
export class CreateAdminInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Field()
  @IsString()
  @MaxLength(120)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  role!: UserRole;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  centerId?: string;
}
