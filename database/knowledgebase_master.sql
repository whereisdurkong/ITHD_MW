USE [ticket_system]
GO

/****** Object:  Table [dbo].[knowledgebase_master]    Script Date: 11/10/2025 10:54:46 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[knowledgebase_master](
	[kb_id] [int] IDENTITY(1,1) NOT NULL,
	[kb_desc] [nvarchar](max) NULL,
	[kb_title] [nvarchar](max) NULL,
	[created_by] [nvarchar](100) NULL,
	[created_at] [datetime] NULL,
	[updated_by] [nvarchar](100) NULL,
	[updated_at] [datetime] NULL,
	[kb_category] [varchar](255) NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[kb_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[knowledgebase_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO
