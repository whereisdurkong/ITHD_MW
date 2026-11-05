USE [ticket_system]
GO

/****** Object:  Table [dbo].[pms_master]    Script Date: 11/10/2025 10:56:12 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[pms_master](
	[pms_id] [int] IDENTITY(1,1) NOT NULL,
	[tag_id] [nvarchar](100) NULL,
	[department] [nvarchar](100) NULL,
	[assign_to] [nvarchar](100) NULL,
	[pass_word] [nvarchar](100) NULL,
	[ip_address] [nvarchar](100) NULL,
	[processor] [nvarchar](100) NULL,
	[memory] [nvarchar](100) NULL,
	[storage] [nvarchar](100) NULL,
	[pms_date] [nvarchar](100) NULL,
	[description] [nvarchar](max) NULL,
	[created_by] [nvarchar](100) NULL,
	[created_at] [datetime] NULL,
	[updated_by] [varchar](255) NULL,
	[updated_at] [varchar](255) NULL,
	[assigned_location] [varchar](255) NULL,
	[pms_category] [varchar](255) NULL,
	[model] [varchar](255) NULL,
	[serial] [varchar](255) NULL,
	[is_active] [varchar](255) NULL,
	[lock_at] [datetime] NULL,
	[is_lock] [varchar](255) NULL,
	[lock_by] [varchar](255) NULL,
	[monitor_model] [varchar](255) NULL,
	[monitor_serial] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[pms_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[pms_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO


