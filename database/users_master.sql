USE [ticket_system]
GO

/****** Object:  Table [dbo].[users_master]    Script Date: 11/10/2025 11:01:13 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[users_master](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[emp_FirstName] [nvarchar](100) NOT NULL,
	[emp_LastName] [nvarchar](100) NOT NULL,
	[user_name] [nvarchar](100) NOT NULL,
	[pass_word] [nvarchar](100) NOT NULL,
	[emp_email] [nvarchar](150) NOT NULL,
	[emp_tier] [nvarchar](50) NOT NULL,
	[emp_role] [nvarchar](50) NOT NULL,
	[emp_department] [nvarchar](150) NOT NULL,
	[emp_position] [nvarchar](100) NOT NULL,
	[created_at] [datetime] NULL,
	[created_by] [nvarchar](100) NULL,
	[updated_at] [datetime] NULL,
	[updated_by] [nvarchar](100) NULL,
	[is_active] [bit] NULL,
	[emp_phone] [varchar](100) NULL,
	[emp_location] [varchar](255) NULL,
	[is_lock] [varchar](255) NULL,
	[lock_by] [varchar](255) NULL,
	[lock_at] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[emp_email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[user_name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[users_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO

ALTER TABLE [dbo].[users_master] ADD  DEFAULT ((1)) FOR [is_active]
GO


